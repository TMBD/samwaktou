db.audios.dropIndex('text_search_index');
db.audios.dropIndex('date_index');
db.audios.dropIndex('author_index');
db.audios.dropIndex('theme_index');

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

db.audios.createIndex(
{
	date: -1
},
{
	name: "date_index"
});

db.audios.createIndex(
{
	author: 1
},
{
	name: "author_index"
});

db.audios.createIndex(
{
	theme: 1
},
{
	name: "theme_index"
});
