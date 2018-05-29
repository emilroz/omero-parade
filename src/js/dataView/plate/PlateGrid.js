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

import Well from './Well';
import gsvlScreenPlot from '../svgComponents/gsvlScreenPlot'


class PlateGrid extends React.Component {

    constructor(props) {
        super(props);
        let screen_display = null;
    }

    componentWillUpdate() {
        const plateData = this.props.plateData;
        const plateGrids = plateData.map(
            v => v.grid
        );
        console.log("update-plateData", plateData);
        console.log("update-plateGrids", plateGrids);
        let wellClicked = ble => { return };
        if (this.screen_display == null && plateGrids.length > 0)  {
            this.screen_display = gsvlScreenPlot(
                "#gsvlScreenPlot", plateGrids, "x", "y",
                this.props.handleImageWellClicked);
            this.screen_display.render();
        } else if (plateGrids.length > 0) {
            this.screen_display._tile_data(plateGrids);
            this.screen_display.render();
        }
    }

    componentDidMount() {
        const plateData = this.props.plateData;
        const plateGrids = plateData.map(
            v => v.grid
        );
        console.log("plateData", plateData);
        console.log("plateGrids", plateGrids);
        let wellClicked = ble => { return };
        if (plateGrids.length > 0) {
            this.screen_display = gsvlScreenPlot(
                "#gsvlScreenPlot", plateGrids, "x", "y", wellClicked);
            this.screen_display.render();
        }
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
        return (
            <div>
                <div id="gsvlScreenPlot">
                </div>
            </div>
        );
    }
}

export default PlateGrid
