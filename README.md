This is a [Next.js](https://nextjs.org/) project that will add a note whenever a conversation is tagged.

## Use Case

[Prezly](https://www.prezly.com) uses intercom for Customer Support. Depending on the type of question our support agents need to handle the case differently.
This project helps with that as a note is created on the conversation with a summary of the procedure and more information.

* Conversation is tagged in intercom (type_bug, type_feature,...)
* Look if there is additional information to post (template by tag_name)
* Add a note to the conversation with links to procedures or help

## Getting Started

Copy .env.example to .env.production
Fill in .ENV variables (find intercom key at https://app.intercom.com/a/apps/[APP_ID]/developer-hub)
Deploy to vercel

`vercel --prod`

## Templates

All templates live in `/public/templates` with an example type_bug template.

The name of the template needs to match the tag_name (in intercom) exactly. If no template is found the bot will stay quiet.

## Set-up in intercom

* Deploy to vercel get app URL
* Create new app @ https://app.intercom.com/a/apps/[APP_ID]/developer-hub
* Go to created app > webhooks
* Add webhook [APP_URL]/api/conversations 
* Only trigger webhook for topic `conversation_part.tag.created`

## Deploy on Vercel

The easiest way to deploy the app and allow anyone in the company to change the template files (public/templates directory) is to use the [Vercel Platform](https://vercel.com/import).

Check out [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
