import { BooruClient, Konachan } from '@papitaconpure/booru-client';

//Instance a Booru adapter
const konachan = new Konachan();

//Create a Booru client with the adapter and our credentials
const client = new BooruClient(konachan, {
	credentials: {},
	tags: {

	},
});

//Return the last 5 posts containing the tag "touhou" and a "Safe" content rating
const posts = await client.search('hololive', { limit: 5, rating: 's' });

//Log the id, tags and url of every obtained post
for (const post of posts) {
	console.log({
		id: post.id,
		tags: post.tags,
		url: post.url,
	});
}
