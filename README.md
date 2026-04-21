![GitHub package.json dependency version](https://img.shields.io/node/v/package-json)
![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/PapitaConPure/booru-client)
![GitHub repo size](https://img.shields.io/github/repo-size/PapitaConPure/booru-client)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/%40papitaconpure%2Fbooru-client)
![Twitter Follow](https://img.shields.io/twitter/follow/PapitaPure?label=%40PapitaPure&style=social&link=https://twitter.com/PapitaPure)

<h1 align="center">
	Booru Client JS
</h1>
<p align="center">
An extensible, zero-dependency, optimized imageboard client for Javascript.
</p>

<br>

## Installation
<table>
<tr>
<td>Manager</td>
<td>Command</td>
</tr>

<tr>
<td><b>npm</b></td>
<td>

```cmd
npm install --save @papitaconpure/booru-client
```
</td>
</tr>

<tr>
<td><b>Bun</b></td>
<td>

```cmd
bun add @papitaconpure/booru-client
```
</td>
</tr>
<tr>

<td><b>Deno</b></td>
<td>

```cmd
deno add npm:@papitaconpure/booru-client
```
</td>
</tr>
</table>

## Basic Usage
**Gelbooru:**
```ts
import { BooruClient, Gelbooru } from '@papitaconpure/booru-client';

//Instance a Booru adapter
const gelbooru = new Gelbooru();

//Create a Booru client with the adapter and our credentials
const client = new BooruClient(gelbooru, {
	apiKey: 'your Gelbooru API key',
	userId: 'your Gelbooru user ID',
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
```

**Danbooru:**
```ts
import { BooruClient, Danbooru } from '@papitaconpure/booru-client';

//Instance a Booru adapter
const danbooru = new Danbooru();

//Create a Booru client with the adapter and our credentials
const client = new BooruClient(danbooru, {
	apiKey: 'your Danbooru API key',
	login: 'your Danbooru user ID',
});

//Return the last 3 posts containing the tag "touhou" and a "Sensitive" content rating
const posts = await client.search('touhou rating:sensitive', { limit: 3 });

//Log the id, tags and url of every obtained post
for (const post of posts) {
	console.log({
		id: post.id,
		tags: post.tags,
		url: post.url,
	});
}
```

For more advanced usage, please [check out all of the examples](https://github.com/PapitaConPure/booru-client-js/blob/de0400d23ced275016a8b6da36c207b18fc6767d/examples).

## Smart Tag Resolution (Batching + Deduplication)

This client automatically tries to optimize tag resolution under the hood using:
* Smart request batching
* In-flight request deduplication
* Multi-layer caching

This means that multiple requests for overlapping tags may automatically merge into a single tag store lookup or API call, whichever comes first.

```ts
//Fetches the last 4 posts containing the tag 'megumin' from a booru.
const posts = await client.search('megumin', { limit: 4 });

//Fetches tags "in parallel", batching tag resolution requests across posts
//and avoiding duplicated requests within a reasonable time window.
await Promise.all(
	posts.map(async (post) => {
		const tags = await client.fetchPostTags(post);

		//Log each Post's ID and tags after fetching.
		console.log(post.id);
		console.dir(post.tags);
	}),
);
```

```ts
//These 24 tag requests are automatically reduced to only 1~8 API calls
//With default BooruClient settings, usually only 1 API call is required!
await Promise.all([
	client.fetchTagsByNames({ names: ['hakurei_reimu'] }),
	client.fetchTagsByNames({ names: ['hakurei_reimu', 'kirisame_marisa'] }),
	client.fetchTagsByNames({ names: ['hakurei_reimu', 'kirisame_marisa', 'alice_margatroid'] }),
	client.fetchTagsByNames({ names: ['kirisame_marisa', 'alice_margatroid', 'ibuki_suika'] }),
	client.fetchTagsByNames({ names: ['alice_margatroid', 'ibuki_suika', 'houraisan_kaguya'] }),
	client.fetchTagsByNames({ names: ['ibuki_suika', 'houraisan_kaguya', 'shameimaru_aya'] }),
	client.fetchTagsByNames({ names: ['houraisan_kaguya', 'shameimaru_aya', 'kochiya_sanae'] }),
	client.fetchTagsByNames({ names: ['shameimaru_aya', 'kochiya_sanae', 'hinanawi_tenshi'] }),
	client.fetchTagsByNames({ names: ['kochiya_sanae', 'hinanawi_tenshi'] }),
	client.fetchTagsByNames({ names: ['hinanawi_tenshi'] }),
]);
```

Keep in mind, Post requests are currently executed independently without caching, batching, or request deduplication. These optimizations *are* planned for future releases however.
