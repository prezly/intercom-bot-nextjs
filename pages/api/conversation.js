const intercom = require('intercom-client');
const fs = require('fs');
const intercom_client = new intercom.Client({token: process.env.INTERCOM_API_TOKEN});

export default async (req, res) => {
    try {
        const request_body = req.body;

        if (request_body.type && request_body.type === 'notification_event' && request_body.topic === 'ping') {
            console.log("Webhook Test Request Received");
            res.status(200).end();
        }

        if (request_body.type && request_body.type === 'notification_event' && request_body.topic === 'conversation_part.tag.created') {
            await handleIntercomConversationWasTagged(request_body.data);

            res.status(200).end();
        }

        if (request_body.type && request_body.type === 'notification_event' && request_body.topic === 'conversation.admin.closed') {
            await handleIntercomConversationClosed(request_body.data);

            res.status(200).end();
        }

        res.status(200).end();
    } catch (error) {
        console.error(error);

        res.status(500).end();
    }
}


async function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

async function ifTemplateExistsReplyToIntercom(template_path, conversation_id, author_id = 36676) {
    let template_name = __dirname + `/../${template_path}.html`;

    if (fs.existsSync(template_name)) {
        let template_body = await readFile(template_name);

        // Reply to a conversation
        let reply = {
            id: conversation_id,
            admin_id: author_id,
            body: template_body, //get it from file contents
            type: 'admin',
            message_type: 'note'
        };

        return await intercom_client.conversations.reply(reply);

    } else {
        console.log('The file does not exist.');
    }
}

async function handleIntercomConversationClosed(data) {
    let tags_in_conversation = data.item.tags.tags;
    let conversation_id = data.item.id;

    const containsTypeTag = tags_in_conversation.some((tag) => tag.name.startsWith('type_'));
    const conversationMessage = data.item.conversation_message;

    // Skip reopening messages for conversations that were started by us (outbound messages)
    if (data.item.conversation_message.author.type === 'admin') {
        return;
    }

    if (containsTypeTag === false) { //no tag added, but conversation has been closed
        console.log('Conversation does not have type tag');

        let conversation_parts = data.item.conversation_parts.conversation_parts;
        const conversationPartThatClosed = conversation_parts.find((conversation_part) => conversation_part.part_type === 'close');
        const authorIdThatClosed = conversationPartThatClosed.author.id;

        let reopen = {
            id: conversation_id,
            admin_id: authorIdThatClosed,
            type: 'admin',
            message_type: 'open'
        };

        // reopen conversation
        await ifTemplateExistsReplyToIntercom('workflow/conversation_closed_without_tag', conversation_id, authorIdThatClosed);
        await intercom_client.conversations.reply(reopen);

        if (data.item.assignee.id !== authorIdThatClosed) {
            let assignment = {
                id: conversation_id,
                admin_id: authorIdThatClosed,
                assignee_id: authorIdThatClosed,
                type: 'admin',
                message_type: 'assignment'
            };

            await intercom_client.conversations.reply(assignment);
        } else {
            console.log('conversation already linked to that author');
        }

    }
    return;
}

async function handleIntercomConversationWasTagged(data) {
    let tags_added = data.item.tags_added;

    for (let new_tag of tags_added.tags) {
        await ifTemplateExistsReplyToIntercom(`templates/${new_tag.name}`, data.item.id);
    }
}
