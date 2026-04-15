<h1 align="center">
	Booru Client
</h1>
<p align="center">
An extensible, zero-dependency imageboard client with multi-layer tag caching.
</p>


![GitHub package.json dependency version](https://img.shields.io/node/v/package-json)
![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/PapitaConPure/booru-client)
![GitHub repo size](https://img.shields.io/github/repo-size/PapitaConPure/booru-client)
![Twitter Follow](https://img.shields.io/twitter/follow/PapitaPure?label=%40PapitaPure&style=social&link=https://twitter.com/PapitaPure)

## Installation
<table>
<tr>
<td>Manager</td>
<td>Command</td>
</tr>

<tr>
<td>npm</td>
<td>

```cmd
npm install --save @papitaconpure/booru-client
```
</td>
</tr>

<tr>
<td>Bun</td>
<td>

```cmd
bun add @papitaconpure/booru-client
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
for(const post of posts) {
	console.log({
		id: post.fileUrl,
		tags: post.tags,
		url: post.url,
	});
}
```
