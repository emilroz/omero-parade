
const gsvlScreenPlotEvents = {
    changeDisplayMode: (gsvlScreen, value) => {
        if (gsvlScreen === undefined) return;
        gsvlScreen.change_mode(value);
    },

    changeTileSize: (gsvlScreen, value) => {
        if (gsvlScreen === undefined) return;
        gsvlScreen.change_tile_size(parseInt(value));
    },

    changeMarginSize: (gsvlScreen, value) => {
        if (gsvlScreen === undefined) return;
        gsvlScreen.change_margin_size(parseInt(value));
    },

    changeOffsetSize: (gsvlScreen, value) => {
        if (gsvlScreen === undefined) return;
        gsvlScreen.change_offset_size(parseInt(value));
    },

    changeThumbnailsRendering: (gsvlScreen, checked) => {
        if (gsvlScreen === undefined) return;
        gsvlScreen.render_thumbnails(checked);
    },

    changeAspectRatio: (gsvlScreen, value) => {
        if (gsvlScreen === undefined) return;
        gsvlScreen.change_aspect_ratio(value);
    },

    changeColorProperty: (gsvlScreen, value) => {
        if (gsvlScreen === undefined) return;
        if (value == "None") {
            gsvlScreen.change_color_property(null);
        } else {
            gsvlScreen.change_color_property(value);
        }
    },

    changeSortProperty: (gsvlScreen, value) => {
        if (gsvlScreen === undefined) return;
        if (value == "None") {
            gsvlScreen.change_sort_property(null);
        } else {
            gsvlScreen.change_sort_property(value);
        }
    },

    loadStatistics: (gsvlScreen, value) => {
        if (gsvlScreen === undefined) return;
    }
}

export default gsvlScreenPlotEvents;