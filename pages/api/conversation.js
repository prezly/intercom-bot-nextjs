const intercom = require('intercom-client');
const fs = require('fs');
const path = require('path');
const intercom_client = new intercom.Client({token: process.env.INTERCOM_API_TOKEN});
const intercom_author_id = process.env.INTERCOM_AUTHOR_ID;

export default async (req, res) => {
    try {
        const request_body = req.body;

        if (request_body.type && request_body.type === 'notification_event' && request_body.topic === 'ping') {
            console.log("Webhook Test Request Received");
            res.status(200).json({ message: 'Webhook Test Request Received' })
        }

        if (request_body.type && request_body.type === 'notification_event' && request_body.topic === 'conversation_part.tag.created') {
            await handleIntercomConversationWasTagged(request_body.data);

            res.status(200).json({ message: 'OK' })
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

async function ifTemplateExistsReplyToIntercom(template_name, conversation_id, author_id = intercom_author_id) {
    let template_path = path.resolve(`public/templates/${template_name}.html`)

    if (fs.existsSync(template_path)) {
        let template_body = await readFile(template_path);

        // Reply to a conversation
        let reply = {
            id: conversation_id,
            admin_id: author_id,
            body: template_body,
            type: 'admin',
            message_type: 'note'
        };

        return await intercom_client.conversations.reply(reply);

    } else {
        console.log(`The file ${template_path} does not exist.`);
    }
}

async function handleIntercomConversationWasTagged(data) {
    let tags_added = data.item.tags_added;

    for (let new_tag of tags_added.tags) {
        await ifTemplateExistsReplyToIntercom(`${new_tag.name}`, data.item.id);
    }
}
