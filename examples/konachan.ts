import { BooruClient, Konachan } from '@papitaconpure/booru-client';

//Instance a Booru adapter
const konachan = new Konachan();

//Create a Booru client with the adapter and our credentials
const client = new BooruClient(konachan, {});

//Return the last 5 posts containing the tag "touhou" and a "Safe" content rating
const posts = await client.search('hololive', { limit: 1, random: true });

//Log the id, tags and url of every obtained post
for (const post of posts) {
	console.dir(
		{
			id: post.id,
			tags: (await client.fetchPostTags(post)).map((t) => `${t.name} (${t.count})`),
			url: post.url,
		},
		{ depth: null },
	);
}
