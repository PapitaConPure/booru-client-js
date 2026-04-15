import { BooruClient, Gelbooru } from '../src';

//Instance a Booru adapter
const gelbooru = new Gelbooru();

//Create a Booru client with the adapter and our credentials
const client = new BooruClient(gelbooru, {
	apiKey: process.env.TEST_GELBOORU_APIKEY!,
	userId: process.env.TEST_GELBOORU_USERID!,
});

//Returns 5 random megumim post with a "General" content rating
const posts = await client.search('megumin rating:general', { limit: 5, random: true });

//Log the id, tags and url of every obtained post
for(const post of posts) {
	console.log({
		id: post.id,
		tags: post.tags,
		url: post.url,
	});
}
