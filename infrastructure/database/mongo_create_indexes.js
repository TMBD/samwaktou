db.audios.dropIndex('text_search_index');
db.audios.createIndex(
{
	keywords: "text",
	author: "text",
	theme: "text",
	description: "text"
},
{
	name: "text_search_index",
	default_language: "fr",
	weights:
	{
		keywords: 5,
		author: 3,
		theme: 3,
		description: 2
	}
});
