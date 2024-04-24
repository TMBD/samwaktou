mongodump --host= --port= --username= --password= --collection=audios --db=fatwa --authenticationDatabase=admin --out=audios_dump_2024_04_20

mongorestore --host= --port= --username= --password= --authenticationDatabase=admin audios_dump_2024_04_20

----------

mongoexport --host= --port= --username= --password= --collection=audios --db=fatwa --authenticationDatabase=admin --out=audios_backup_2024_04_20.json

mongoimport --host= --port= --username= --password= --collection=audios --db=fatwa --authenticationDatabase=admin --file=audios_backup_2024_04_20.json
