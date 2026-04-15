# booru-fetch
A simple Booru wrapper mostly for my personal projects. Uses Node fetch API.

## Basic Usage
```ts
import { BooruClient, Gelbooru } from '@papitaconpure/booru-client';

//Instance a Booru adapter
const gelbooru = new Gelbooru();

//Create a Booru client with the adapter and pass your credentials
const client = new BooruClient(gelbooru, {
	apiKey: 'your Gelbooru API key',
	userId: 'your Gelbooru user ID',
});

//Return 5 random posts containing the tag "megumin" and a "General" content rating
const posts = await client.search('megumin rating:general', { limit: 5, random: true });

//Log the id, tags and url of every obtained post
for(const post of posts) {
	console.log({
		id: post.id,
		tags: post.tags,
		url: post.url,
	});
}
```
