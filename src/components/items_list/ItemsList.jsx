/* eslint-disable react/sort-comp */
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";
import WidgetsIcon from "@mui/icons-material/Widgets";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import setClass from "classnames";
import PropTypes from "prop-types";
import React from "react";

import { ShowIf } from "../../utils/react/showif";

class ItemsList extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.defaultState;
        this.focusListItem = this.focusListItem.bind(this);
        this.blurListItem = this.blurListItem.bind(this);
        this.initControlsSwitchFromKeyboard = this.initControlsSwitchFromKeyboard.bind(this);
        window.addEventListener("keydown", this.initControlsSwitchFromKeyboard, false);
    }

    get defaultState() {
        const { materials, index } = this.props;
        return {
            editedName: materials[index].name,
            editedIndex: index,
        };
    }

    componentDidUpdate(prevProps) {
        const { materials, index } = this.props;
        if (prevProps.materials.length > materials.length)
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({ editedName: materials[index].name, editedIndex: index });
    }

    initControlsSwitchFromKeyboard(event) {
        const { materials, index, onItemClick } = this.props;
        if (!event.shiftKey) return; // Shift key must be down

        const nextIndex = materials.length === 1 + index ? 0 : index + 1;
        const previousIndex = index === 0 ? materials.length - 1 : index - 1;

        switch (event.keyCode) {
            case 85: // U
                onItemClick(previousIndex); // Up => decreasing index, b/c of descending order
                break;
            case 68: // D
                onItemClick(nextIndex);
                break;
            default:
        }
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.initControlsSwitchFromKeyboard, false);
    }

    focusListItem(event, index) {
        this.setState({ editedIndex: index, editedName: event.target.value });
    }

    blurListItem() {
        const { onItemClick, onNameUpdate, index } = this.props;
        const { editedName, editedIndex } = this.state;
        onNameUpdate(editedName, editedIndex);
        onItemClick(index);
        this.setState({ editedName: null, editedIndex: null });
    }

    /**
     * Used when clicking remove item
     * e.preventDefault is used to inform further
     * elements that event is already handled and they should skip
     * handling it, otherwise the page can crash.
     * @param {React.MouseEvent} e - JS DOM event
     * @param {Number} index - index of element that should be removed
     */
    onDeleteIconClick(e, index) {
        const { onRemove } = this.props;
        e.preventDefault();
        onRemove(index);
    }

    /**
     * this function is used for handling clicks on different elements
     * here is used check if the event is default prevented in order to
     * avoid propagated actions that already was handled and don't handle
     * extra actions that can lead to page crashes
     * @param {React.MouseEvent} e - js dom event
     * @param {Number} index - index of element that should be removed
     */
    onItemListClick(e, index) {
        const { onItemClick } = this.props;
        if (e.defaultPrevented) return;
        e.preventDefault();
        onItemClick(index);
    }

    renderListItem(entity, index, indexFromState) {
        const { name, isUpdated, isNonPeriodic } = entity;
        const { editedIndex, editedName } = this.state;
        const isBeingEdited = editedIndex === index;
        const isBeingActive = index === indexFromState;
        return (
            <ListItem
                key={name + "-" + index}
                button
                dense
                onClick={(e) => this.onItemListClick(e, index)}
                className={setClass(
                    { active: isBeingEdited || isBeingActive },
                    { updated: isUpdated || isBeingEdited },
                )}
            >
                <ShowIf condition={Boolean(entity.id)}>
                    <ListItemIcon className="list-item-icon superscript-icon">
                        <CheckIcon />
                    </ListItemIcon>
                </ShowIf>

                <ListItemIcon className="list-item-icon non-periodic-icon">
                    {isNonPeriodic ? <DeviceHubIcon /> : <WidgetsIcon />}
                </ListItemIcon>

                <ListItemText
                    className="list-item-text"
                    primary={
                        <TextField
                            className="m-0 list-item-text_primary"
                            InputProps={{ disableUnderline: true }}
                            onFocus={(e) => this.focusListItem(e, index)}
                            value={isBeingEdited ? editedName : entity.name}
                            onChange={(event) => this.setState({ editedName: event.target.value })}
                            onBlur={this.blurListItem}
                        />
                    }
                    secondary={
                        <span className="list-item-text_secondary">
                            Formula: <b>{entity.formula}</b>
                        </span>
                    }
                />

                <ListItemIcon
                    className="list-item-icon icon-button-delete"
                    onClick={(e) => {
                        this.onDeleteIconClick(e, index);
                    }}
                >
                    <DeleteIcon />
                </ListItemIcon>
            </ListItem>
        );
    }

    render() {
        const { className, materials, index } = this.props;
        return (
            <div className={setClass(className, "materials-designer-items-list")}>
                <List component="nav" dense>
                    {materials.map((m, i) => this.renderListItem(m, i, index))}
                </List>
            </div>
        );
    }
}

ItemsList.propTypes = {
    className: PropTypes.string.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    materials: PropTypes.array.isRequired,
    index: PropTypes.number.isRequired,
    onItemClick: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    onNameUpdate: PropTypes.func.isRequired,
};

export default ItemsList;
