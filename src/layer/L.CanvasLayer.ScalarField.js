/**
 * ScalarField ('Raster') on canvas
 */
L.CanvasLayer.ScalarField = L.CanvasLayer.extend({
    options: {
        click: true, // 'click' event
        color: null
    },

    initialize: function (scalarField, options) {
        this.field = scalarField;
        L.Util.setOptions(this, options);
        if (this.options.color === null) {
            this.options.color = this.defaultColorScale();
        };
    },

    defaultColorScale: function () {
        return chroma.scale(['white', 'black']).domain(this.field.range);
    },

    onLayerDidMount: function () {
        if (this.options.click) {
            this._map.on('mouseover', this._activateClick, this);
            this._map.on('click', this._queryValue, this);
        }
    },

    onLayerWillUnmount: function () {
        if (this.options.click) {
            this._map.off('mouseover', this._activateClick, this);
            this._map.off('click', this._queryValue, this);
        }
    },

    setData: function (data) {
        // -- custom data set
        // TODO
        this.needRedraw(); // -- call to drawLayer
    },

    onDrawLayer: function (viewInfo) {
        // canvas preparation
        let g = viewInfo.canvas.getContext('2d');
        g.clearRect(0, 0, viewInfo.canvas.width, viewInfo.canvas.height);

        let cells = this.field.gridLonLatValue();
        let halfCell = this.field.cellsize / 2.0;
        for (var i = 0; i < cells.length; i++) {
            //TODO check in Bounds?
            let {
                lon, lat, value
            } = cells[i];

            if (value === null) {
                continue;
            }

            // rectangle
            let ul = viewInfo.layer._map.latLngToContainerPoint(
                [lat + halfCell, lon - halfCell]);
            let lr = viewInfo.layer._map.latLngToContainerPoint(
                [lat - halfCell, lon + halfCell]);

            let width = Math.abs(ul.x - lr.x);
            let height = Math.abs(ul.y - lr.y);

            // color
            g.fillStyle = this.options.color(value);

            g.beginPath();
            g.fillRect(ul.x, ul.y, width, height);
            g.fill();
            g.closePath();
            g.stroke();
        }
    },

    getBounds: function () {
        let bb = this.field.extent();
        let southWest = L.latLng(bb[1], bb[0]),
            northEast = L.latLng(bb[3], bb[2]);
        let bounds = L.latLngBounds(southWest, northEast);
        return bounds;
    },

    getPixel: function (x, y) {
        let ctx = this._canvas.getContext('2d');
        let pixel = ctx.getImageData(x, y, 1, 1);
        // array [r, g, b, a]
        return pixel;
    },

    _activateClick: function () {
        this._map.getContainer().style.cursor = 'default';
    },

    _queryValue: function (e) {
        let lon = e.latlng.lng;
        let lat = e.latlng.lat;
        let result = {
            latlng: e.latlng,
            value: this.field.valueAt(lon, lat)
        };
        this.fireEvent('click', result); /*includes: L.Mixin.Events,*/
    }
});

L.canvasLayer.scalarField = function (scalarField, options) {
    return new L.CanvasLayer.ScalarField(scalarField, options);
}