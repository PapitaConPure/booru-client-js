import { BooruClient, Danbooru } from '@papitaconpure/booru-client';

//Instance a Booru adapter
const danbooru = new Danbooru();

//Create a Booru client with the adapter and our credentials
const client = new BooruClient(danbooru, {
	apiKey: process.env.TEST_DANBOORU_APIKEY as string,
	login: process.env.TEST_DANBOORU_LOGIN as string,
});

//These 24 tag requests are automatically reduced to only 1~8 API calls
//With default BooruClient settings, usually only 1 API call is required!
const results = await Promise.all([
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

//10, which are the times the function was called
console.log(results.length);

//24 names
console.log(results.flatMap((result) => result.map((tag) => `${tag.name} (${tag.count})`)));

process.exit(0);
