//
// Copyright (C) 2018 University of Dundee & Open Microscopy Environment.
// All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

import React, { Component } from 'react';

import * as d3 from "d3";

console.log('d3', d3);

import Well from './Well';
import gsvlScreenPlot from '../svgComponents/gsvlScreenPlot'
import gsvlScreenPlotEvents from '../svgComponents/gsvlScreenPlotEvents'


class PlateGrid extends React.Component {

    constructor(props) {
        super(props);
        let screen_display = null;
    }

    updateGsvlScreenControls() {
        d3.select("#input_grid_size").attr("value", this.screen_display.change_tile_size()[0]);
        d3.select("#input_margin_size").attr("value", this.screen_display.change_margin_size()[0]);
        d3.select("#input_offset_size").attr("value", this.screen_display.change_offset_size());
        d3.select("#input_aspect_ratio").attr("value", this.screen_display.change_aspect_ratio());
    }

    renderGsvlScreen() {
        const plateData = this.props.plateData;
        let plateGrids = plateData.map(
            v => v.grid
        );
        const filteredPlateGrids = plateGrids.filter(Boolean);
        if (filteredPlateGrids.length !== plateGrids.length) {
            return;
        }
        const featureList = this.props.tableData;
        const features = Object.keys(featureList);
        const selected = this.props.selectedWellIds;
        const filteredIds = this.props.filteredImages.map(i => i.id);
        if (this.screen_display == null && filteredPlateGrids.length > 0)  {
            this.screen_display = gsvlScreenPlot(
                "#gsvlScreenPlot", filteredPlateGrids, "x", "y",
                this.props.handleImageWellClicked, this.props.thumbnails);
            this.screen_display.set_color_scale_div("#color_scale");
            this.screen_display._selected_wells(selected);
            this.screen_display._visible_wells(filteredIds);
            this.updateGsvlScreenControls();
            if (features.length > 0) {
                this.screen_display.change_parade_analytics(featureList, true);
            } else {
                this.screen_display.render(true);
            }
        } else if (filteredPlateGrids.length > 0) {
            this.screen_display._thumbnail_array(this.props.thumbnails); // Nasty at best!!!
            this.screen_display._tile_data(filteredPlateGrids);
            this.screen_display._selected_wells(selected);
            this.screen_display._visible_wells(filteredIds);
            this.updateGsvlScreenControls();
            if (features.length > 0) {
                this.screen_display.change_parade_analytics(featureList, true);
            } else {
                this.screen_display.render(true);
            }
        }
    }

    componentDidUpdate() {
        this.renderGsvlScreen();
    }

    componentDidMount() {
        this.renderGsvlScreen();

        /*
        $(this.refs.plateGrid).selectable({
            filter: 'td.well',
            distance: 2,
            stop: () => {
                // Make the same selection in the jstree etc
                let images = [];
                $(".plateGrid .ui-selected").each((index, element) => {
                    const imageId = parseInt(
                        element.getAttribute('data-imageid'), 10
                    );
                    const wellId = parseInt(
                        element.getAttribute('data-wellid'), 10
                    );
                    const field = parseInt(
                        element.getAttribute('field'), 10
                    );
                    images.push({
                        id: imageId,
                        wellId: wellId,
                        field: field
                    });
                });
                this.props.setImagesWellsSelected('well', images);
            },
        });
        */
    }

    componentWillUnmount() {
        // cleanup plugin
        $(this.refs.dataIcons).selectable( "destroy" );
    }

    renderPlateGrid(plateData) {
        const iconSize = this.props.iconSize,
            placeholderStyle = {
                width: iconSize + 'px',
                height: iconSize + 'px',
            },
            selectedWellIds = this.props.selectedWellIds,
            handleImageWellClicked = this.props.handleImageWellClicked,
            filteredIds = this.props.filteredImages.map(i => i.id);
        const columnNames = plateData.collabels.map(l => (<th key={l}>{l}</th>));
        const grid = plateData.grid;
        const rows = plateData.rowlabels.map((r, rowIndex) => {
            const wells = plateData.collabels.map((c, colIndex) => {
                const well = grid[rowIndex][colIndex];
                if (well) {
                    const hidden = (filteredIds !== undefined && filteredIds.indexOf(well.id) === -1);
                    const selected = selectedWellIds.indexOf(well.wellId) > -1;
                    return (
                        <Well
                            key={well.wellId}
                            id={well.wellId}
                            iid={well.id}
                            field={well.field}
                            thumb_url={this.props.thumbnails[well.id]}
                            selected={selected}
                            hidden={hidden}
                            iconSize={iconSize}
                            handleWellClick={(event) => {handleImageWellClicked(well, event)}}
                            row={r}
                            col={c}
                            heatmapTableData={this.props.heatmapTableData}
                            tableData={this.props.tableData}
                            viewMode={this.props.viewMode}
                        />
                    )
                }
                return (
                    <td className="placeholder" key={r + "_" + c}>
                        <div style={placeholderStyle} />
                    </td>
                );
            });
            return (
                <tr key={r}>
                    <th>{r}</th>
                    {wells}
                </tr>
            );
        });
        return (
            <table key={plateData.plateId}>
                <tbody>
                    <tr><th colSpan={columnNames.length + 1}>
                        <h2>{plateData.plateName}</h2>
                    </th></tr>
                    <tr>
                        <th> </th>
                        {columnNames}
                    </tr>
                    {rows}
                </tbody>
            </table>
        );
    }

    handleGsvlScreenPlotChange(event, mode) {
        if (this.screen_display === undefined) return;
        console.log(event.target.type);
        if (event.target.type == "checkbox") {
            gsvlScreenPlotEvents[mode](this.screen_display, event.target.checked);
        } else {
            gsvlScreenPlotEvents[mode](this.screen_display, event.target.value);
        }
    }

    renderHeader() {
        /**
        {% for table in tables %}
            <option value={{ table.id }} name="{{ table.name }}"> {{ table.name }} </option>
        {% endfor %}
        */
        const featureList = this.props.tableData;
        const features = Object.keys(featureList);
        let options = [];
        options.push(
            <option key='-1tableFeatures' value="None" name="None">
                None
            </option>
        );
        for (let i = 0; i < features.length; i++) {
            options.push(
                <option key={i+'tableFeatures'} value={features[i]} name={features[i]}>
                    {features[i]}
                </option>
            );
        }
        return (
            <div className="omeroTablesHeader">
            <table className="heatmapheader">
                <thead>
                    <tr>
                        <th className="heatmapheader right">View Mode:</th>
                        <th className="heatmapheader left">
                            <select id="gsvl_viewing_mode"
                                    onChange={ (event) => { this.handleGsvlScreenPlotChange(event, "changeDisplayMode")} }>
                                <option value="Plate">Plate</option>
                                <option value="Image">Image</option>
                            </select>
                        </th>

                        <th className="heatmapheader right">Table:</th>
                        <th className="heatmapheader left">
                            <select id="heatmap_tableSelect" 
                                    onChange={ (event) => { this.handleGsvlScreenPlotChange(event, "loadStatistics") } }>
                                <option value="Need more data" name="Bulk annotation"> "Bulk annotation table" </option>
                            </select>
                        </th>
                    </tr>
                </thead>
            </table>
            <table>
                <thead>
                    <tr>
                        <th className="heatmapheader right">Color by:</th>
                        <th className="heatmapheader left">
                            <select id="gsvl_color_property"
                                    onChange={ (event) => { this.handleGsvlScreenPlotChange(event, "changeColorProperty")} }>
                                { options }
                            </select>
                        </th>
                        <th>
                            <div id="color_scale">Color scale placeholder</div>
                        </th>
                        <th className="heatmapheader right">Label by:</th>
                        <th className="heatmapheader left">
                            <select id="gsvl_text_property"
                                    onChange={ (event) => { this.handleGsvlScreenPlotChange(event, "changeTextProperty")} }>
                                { options }
                            </select>
                        </th>
                        <th className="heatmapheader right">Sort by:</th>
                        <th className="heatmapheader left">
                            <select id="gsvl_sort_property"
                                    onChange={ (event) => { this.handleGsvlScreenPlotChange(event, "changeSortProperty")} }>
                                { options }
                            </select>
                        </th>

                    </tr>
                </thead>
            </table>
            <table>
                <thead>
                    <tr>
                        <th className="heatmapheader right">Tile Size:</th>
                        <th className="heatmapheader left">
                            <input id="input_grid_size"
                                type='number'
                                onChange={ (event) => { this.handleGsvlScreenPlotChange(event, "changeTileSize")} }
                                style={{width: '35px'}}></input>
                        </th>
                        <th className="heatmapheader right">Margin:</th>
                        <th className="heatmapheader left">
                            <input id="input_margin_size"
                                type='number'
                                onChange={ (event) => { this.handleGsvlScreenPlotChange(event, "changeMarginSize")} }
                                style={{width: '35px'}}/>
                        </th>
                        <th className="heatmapheader right">Offset:</th>
                        <th className="heatmapheader left">
                            <input id="input_offset_size"
                                type='number'
                                onChange={ (event) => { this.handleGsvlScreenPlotChange(event, "changeOffsetSize")} }
                                style={{width: '35px'}}/>
                        </th>
                        <th className="heatmapheader right">Aspect ratio:</th>
                        <th className="heatmapheader left">
                            <input id="input_aspect_ratio"
                                type='number'
                                onChange={ (event) => { this.handleGsvlScreenPlotChange(event, "changeAspectRatio")} }
                                style={{width: '35px'}}/>
                        </th>
                        <th className="heatmapheader right">
                            <input id="input_thumnnails"
                                    type='checkbox'
                                    onChange={ (event) => { this.handleGsvlScreenPlotChange(event, "changeThumbnailsRendering")} }/>
                        </th>
                        <th className="heatmapheader left">Thumbnails?</th>
                    </tr>
                </thead>
            </table>
        </div>
    )}

    render() {
        /**
            const plateGrids = this.props.plateData.map(
                v => this.renderPlateGrid(v)
            );
            console.log("render plateGrids", plateGrids);
            <div className="plateGrid" ref="plateGrid">
                {plateGrids}
            </div>
        */
        // if (this.screen_display != null) this.gsvlScreenUpdate();
        const gsvlScreenPlotHeader = this.renderHeader();
        return (
            <div>
                { gsvlScreenPlotHeader }
                <div id="gsvlScreenPlot"></div>
            </div>
        );
    }
}

export default PlateGrid
