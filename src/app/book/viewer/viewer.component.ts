import { Page } from './../../model/page.model';
import { KrameriusApiService } from './../../services/kramerius-api.service';
import { BookService } from './../../services/book.service';
import { Component, OnInit, Input,
  OnChanges, SimpleChanges, SimpleChange } from '@angular/core';

declare var ol: any;

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent implements OnInit, OnChanges {

  // private url1 = 'https://kramerius.mzk.cz/search/zoomify/uuid:0e859fd0-9a32-11e7-920d-005056827e51/';
  // private width1 = 1688;
  // private height1 = 2581;

  // private url2 = 'https://kramerius.mzk.cz/search/zoomify/uuid:0e8f3cc0-9a32-11e7-920d-005056827e51/';
  // private width2 = 1695;
  // private height2 = 2587;

  // private url1 = 'https://kramerius.mzk.cz/search/zoomify/uuid:b30d95e7-6e43-4f09-ad48-3974f55173a2/';
  // private width1 = 1302;
  // private height1 = 1813;

  // private url2 = 'https://kramerius.mzk.cz/search/zoomify/uuid:e8248ecb-c322-4fd4-af8d-0f5a6a3200e6/';
  // // private width2 = 1310;
  // // private height2 = 1877;
  // private width2 = 1265.33;
  // private height2 = 1813;

  // private url1 = 'https://kramerius.mzk.cz/search/zoomify/uuid:5de8741e-3f83-49f8-b7a6-274e1f49603b/';
  // private width1 = 2056;
  // private height1 = 2775;

  // private url2 = 'https://kramerius.mzk.cz/search/zoomify/uuid:ce36d3a4-fd97-4439-9bff-8524a6010be7/';
  // private width2 = 2149;
  // private height2 = 2774;

  private view;
  private imageLayer;
  private zoomifyLayer;
  private imageLayer2;
  private zoomifyLayer2;

  private imageWidth = 0;
  private imageWidth1 = 0;
  private imageHeight = 0;

  private maxResolution = 0;
  private minResolution = 0;

  private zoomFactor = 1.5;

  constructor(public bookService: BookService) { }

  @Input() page: Page;

  ngOnInit() {
    this.init();
  }

  init() {
     this.view = new ol.Map({
      target: 'olzv-map',
      controls: [],
      loadTilesWhileAnimating: true
    });
    let keyboardPan;
    this.view.getInteractions().forEach(function(interaction) {
      if (interaction instanceof ol.interaction.KeyboardPan) {
        keyboardPan = interaction;
      }
    }, this);
    if (keyboardPan) {
      this.view.removeInteraction(keyboardPan);
    }
    this.updateView();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.view) {
      this.bookService.rightPage = null;
      this.updateView();
    }
  }

  updateView() {
    // const image1 = {
    //   url: this.url1,
    //   width: this.width1,
    //   height: this.height1
    // };
    // const image2 = {
    //   url: this.url2,
    //   width: this.width2,
    //   height: this.height2
    // };
    const image1 = this.bookService.leftPage;
    const image2 = this.bookService.rightPage;

    if (image1 != null) {
      this.updateImage(image1, image2, true);
    }
  }


  refresh() {
    this.view.updateSize();
    this.view.getView().setRotation(0);
    this.bestFit();
    const extent = this.view.getView().getProjection().getExtent();
    const center = ol.extent.getCenter(extent);
    this.view.getView().setCenter(center);
  }


  updateImage(image1, image2, zoomify) {
    this.imageWidth1 = 0;
    this.imageWidth = image1.width;
    this.imageHeight = image1.height;
    let extent;
    if (image2 != null) {
      this.imageHeight = Math.max(this.imageHeight, image2.height);
      this.imageWidth = image1.width + image2.width;
      this.imageWidth1 = image1.width;
      extent = [-this.imageWidth / 2, -this.imageHeight, this.imageWidth / 2, 0];
    } else {
      extent = [0, -this.imageHeight, this.imageWidth, 0];
    }
    this.view.removeLayer(this.imageLayer);
    this.view.removeLayer(this.zoomifyLayer);
    this.view.removeLayer(this.imageLayer2);
    this.view.removeLayer(this.zoomifyLayer2);


    const projection = new ol.proj.Projection({
      code: 'ZOOMIFY',
      units: 'pixels',
      extent: extent
    });
    this.maxResolution = this.getBestFitResolution() * this.zoomFactor;
    this.minResolution = 0.5;
    const viewOpts: any = {
      projection: projection,
      center: ol.extent.getCenter(extent),
      extent: extent
    };
    if (this.maxResolution < 100) {
      viewOpts.minResolution = this.minResolution;
      viewOpts.maxResolution = this.maxResolution;
    }
    const view = new ol.View(viewOpts);

    this.view.setView(view);

    if (image2 != null) {
      if (zoomify) {
        this.addZoomifyImage(image1.url, image1.width, image1.height, 1);
        this.addZoomifyImage(image2.url, image2.width, image2.height, 2);
      } else {
        // addStaticImage(image1.url, image1.width, image1.height, 1);
        // addStaticImage(image2.url, image2.width, image2.height, 2);
      }
    } else {
      if (zoomify) {
        this.addZoomifyImage(image1.url, image1.width, image1.height, 0);
      } else {
        // addStaticImage(image1.url, image1.width, image1.height, 0);
      }
    }
    this.refresh();
  }



  addZoomifyImage(url, width, height, type) {
    let extent;
    if (type === 0) {
      extent = [0, -height, width, 0];
    } else if (type === 1) {
      extent = [-this.imageWidth / 2, -height, -this.imageWidth / 2 + width, 0];
    } else if (type === 2) {
      extent = [this.imageWidth / 2 - width, -height, this.imageWidth / 2, 0];
    }
    const iProjection = new ol.proj.Projection({
      code: 'THUMB',
      units: 'pixels',
      extent: extent
    });
    const zProjection = new ol.proj.Projection({
      code: 'ZOOMIFY',
      units: 'pixels',
      extent: extent
    });
    const zoomifySource = new ol.source.Zoomify({
      url: url,
      size: [width, height],
      projection: zProjection,
      tierSizeCalculation: 'truncated',
      imageExtent: extent,
    });
    const imageSource = new ol.source.ImageStatic({
      url: url + 'TileGroup0/0-0-0.jpg',
      projection: iProjection,
      imageExtent: extent
    });
    const iLayer = new ol.layer.Image({
      source: imageSource
    });
    const zLayer = new ol.layer.Tile({
      source: zoomifySource
    });
    this.view.addLayer(iLayer);
    this.view.addLayer(zLayer);
    if (type === 2) {
      this.imageLayer2 = iLayer;
      this.zoomifyLayer2 = zLayer;
    } else {
      this.imageLayer = iLayer;
      this.zoomifyLayer = zLayer;
    }
  }


  addStaticImage(url, width, height, type) {
    let extent;
    if (type === 0) {
      extent = [0, -height, width, 0];
    } else if (type === 1) {
      extent = [-this.imageWidth / 2, -height, -this.imageWidth / 2 + width, 0];
    } else if (type === 2) {
      extent = [this.imageWidth / 2 - width, -height, this.imageWidth / 2, 0];
    }

    const projection = new ol.proj.Projection({
      code: 'IMAGE',
      units: 'pixels',
      extent: extent
    });
    const iLayer = new ol.layer.Image({
      source: new ol.source.ImageStatic({
        url: url,
        imageSize: [width, height],
        projection: projection,
        imageExtent: extent
      })
    });
    this.view.addLayer(iLayer);
    if (type === 2) {
      this.imageLayer2 = iLayer;
    } else {
      this.imageLayer = iLayer;
    }
  }


  getBestFitResolution() {
    const rx = this.imageWidth / (this.view.getSize()[0] - 10)
    const ry = this.imageHeight / (this.view.getSize()[1] - 10);
    return Math.max(rx, ry);
  }

  bestFit() {
    this.view.getView().setResolution(this.getBestFitResolution());
  }



}
