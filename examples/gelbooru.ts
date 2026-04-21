import { BooruClient, Gelbooru } from '@papitaconpure/booru-client';

//Instance a Booru adapter
const gelbooru = new Gelbooru();

//Create a Booru client with the adapter and our credentials
const client = new BooruClient(gelbooru, {
	apiKey: process.env.TEST_GELBOORU_APIKEY as string,
	userId: process.env.TEST_GELBOORU_USERID as string,
});

//Return 5 random posts containing the tag "megumin" and a "General" content rating
const posts = await client.search('megumin rating:general sort:random', { limit: 5 });

//Log the id, tags, url, and extra Gelbooru metadata of every obtained post
for (const post of posts) {
	console.log({
		id: post.id,
		tags: post.tags,
		url: post.url,
		extra: post.extra,
	});
}
