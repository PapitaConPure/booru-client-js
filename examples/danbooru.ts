import { BooruClient, Danbooru } from '@papitaconpure/booru-client';

//Instance a Booru adapter
const danbooru = new Danbooru();

//Create a Booru client with the adapter and our credentials
const client = new BooruClient(danbooru, {
	apiKey: process.env.TEST_DANBOORU_APIKEY!,
	login: process.env.TEST_DANBOORU_LOGIN!,
});

//Return the last 3 posts containing the tag "touhou" and a "Sensitive" content rating
const posts = await client.search('touhou rating:sensitive', { limit: 3 });

//Log the id, tags and url of every obtained post
for(const post of posts) {
	console.log({
		id: post.fileUrl,
		tags: post.tags,
		url: post.url,
	});
}
