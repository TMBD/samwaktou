db.audios.dropIndex('searchIndex');
db.audios.createIndex(
{
	keywords: "text",
	author: "text",
	theme: "text",
	description: "text"
},
{
	name: "searchIndex",
	default_language: "fr",
	weights:
	{
		keywords: 5,
		author: 3,
		theme: 3,
		description: 2
	}
});
