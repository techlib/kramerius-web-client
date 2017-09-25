import { Metadata, TitleInfo, Author, Publisher, Location } from './../model/metadata.model';
import { Page } from './../model/page.model';
import { Injectable } from '@angular/core';
import { parseString, processors, Builder } from 'xml2js';


@Injectable()
export class ModsParserService {

    parse(mods): Metadata {
        const xml = mods.replace(/xmlns.*=".*"/g, '');
        const data = {tagNameProcessors: [processors.stripPrefix], explicitCharkey: true};
        const ctx = this;
        let metadata: Metadata;
        parseString(xml, data, function (err, result) {
            // TODO: Handle parsing error
            metadata = ctx.createMetadata(result);
        });
        return metadata;
    }

    private createMetadata(mods): Metadata {
        const metadata = new Metadata();
        const root = mods['modsCollection']['mods'][0];
        console.log('json metadata', root);

        this.processTitles(root['titleInfo'], metadata);
        this.processAuthors(root['name'], metadata);
        this.processPublishers(root['originInfo'], metadata);
        this.processLocations(root['location'], metadata);
        this.processSubjects(root['subject'], metadata);
        console.log('---', metadata);
        return metadata;
    }

    private processTitles(array, metadata: Metadata) {
        if (!array) {
            return;
        }
        for (const item of array) {
            const titleInfo = new TitleInfo();
            if (item.title) {
                titleInfo.title = item.title[0]['_'];
            }
            if (item.subTitle) {
                titleInfo.subTitle = item.subTitle[0]['_'];
            }
            metadata.titles.push(titleInfo);
        }
    }

    private processAuthors(array, metadata: Metadata) {
        if (!array) {
            return;
        }
        for (const item of array) {
            const author = new Author();
            let given;
            let family;
            if (!item.namePart) {
                continue;
            }
            for (const partName of item.namePart) {
                if (partName['$'] && partName['$']['type']) {
                    const type = partName['$']['type'];
                    if (type === 'given') {
                        given = partName['_'];
                    }
                    if (type === 'family') {
                        family = partName['_'];
                    }
                    if (type === 'date') {
                        author.date = partName['_'];
                    } else {
                        author.name = partName['_'];
                    }
                } else {
                    author.name = partName['_'];
                }
            }
            if (given && family) {
                author.name = family + ', ' + given;
            }
            metadata.authors.push(author);
        }
    }



    private processPublishers(array, metadata: Metadata) {
        if (!array) {
            return;
        }
        for (const item of array) {
            const publisher = new Publisher();
            publisher.name = this.getText(item.publisher);
            publisher.date = this.getText(item.dateIssued);
            metadata.publishers.push(publisher);
        }
    }


    private processLocations(array, metadata: Metadata) {
        if (!array) {
            return;
        }
        for (const item of array) {
            const location = new Location();
            location.physicalLocation = this.getText(item.physicalLocation);
            location.shelfLocator = this.getText(item.shelfLocator);
            metadata.locations.push(location);
        }
    }


    private processSubjects(array, metadata: Metadata) {
        if (!array) {
            return;
        }
        for (const item of array) {
            if (item.topic) {
                metadata.keywords.push(item.topic[0]['_']);
            }
            if (item.geographic) {
                metadata.geonames.push(item.geographic[0]['_']);
            }
        }
    }

    private getText(element) {
        if (element) {
            return element[0]['_'];
        } else {
            return null;
        }
    }


}