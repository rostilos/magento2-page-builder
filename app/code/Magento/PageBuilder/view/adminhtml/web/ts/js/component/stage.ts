/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

import $ from "jquery";
import $t from "mage/translate";
import _ from "underscore";
import DataStore from "./data-store";
import { StageInterface } from "./stage.d";
import Save from "./stage/save";
import Structural from "./stage/structural/abstract";
import EditableArea from "./stage/structural/editable-area";

export default class Stage extends EditableArea implements StageInterface {
    public active: boolean = true;
    public config: {} = {
        name: "stage",
    };
    public loading: KnockoutObservable<boolean>;
    public originalScrollTop: number;
    public parent: any;
    public showBorders: KnockoutObservable<boolean>;
    public stage: Stage;
    public store: DataStore;
    public userSelect: KnockoutObservable<boolean>;
    private save: Save = new Save();

    /**
     * Constructor
     *
     * @param parent
     * @param {KnockoutObservableArray<Structural>} stageContent
     */
    constructor(parent: any, stageContent: KnockoutObservableArray<Structural>) {
        super();
        this.setChildren(stageContent);
        this.stage = this;
        this.parent = parent;

        this.showBorders = parent.showBorders;
        this.userSelect = parent.userSelect;
        this.loading = parent.loading;
        this.originalScrollTop = 0;

        // Create our state and store objects
        this.store = new DataStore();

        // Any store state changes trigger a stage update event
        this.store.subscribe(() => this.emit("stageUpdated"));

        _.bindAll(
            this,
            "onSortingStart",
            "onSortingStop",
        );

        this.on("sortingStart", this.onSortingStart);
        this.on("sortingStop", this.onSortingStop);

        /**
         * Watch for stage update events & manipulations to the store, debouce for 50ms as multiple stage changes
         * can occur concurrently.
         */
        this.on("stageUpdated", _.debounce(() => {
            this.save.renderTree(stageContent)
                .then((renderedOutput) => this.parent.value(renderedOutput));
        }, 500));
    }

    /**
     * The stage has been initiated fully and is ready
     */
    public ready() {
        this.emit("stageReady");
        this.children.valueHasMutated();
        this.loading(false);
    }

    /**
     * Tells the stage wrapper to expand to fullscreen
     */
    public goFullScreen(): void {
        const isFullScreen = this.parent.isFullScreen();
        if (!isFullScreen) {
            this.originalScrollTop = $(window).scrollTop();
            _.defer(() => {
                $(window).scrollTop(0);
            });
        }

        this.stage.parent.isFullScreen(!isFullScreen);
        if (isFullScreen) {
            $(window).scrollTop(this.originalScrollTop);
        }
    }

    /**
     * Determines if pagebuilder is in fullscreen mode
     *
     * @returns {boolean}
     */
    public isFullScreen(): boolean {
        return this.parent.isFullScreen();
    }

    /**
     * Event handler for any element being sorted in the stage
     */
    public onSortingStart() {
        this.showBorders(true);
    }

    /**
     * Event handler for when sorting stops
     */
    public onSortingStop() {
        this.showBorders(false);
    }

    /**
     * Remove a child from the observable array
     *
     * @param child
     */
    public removeChild(child: any): void {
        if (this.children().length === 1) {
            this.parent.alertDialog( {
                content: $t("You are not able to remove the final row from the content."),
                title: $t("Unable to Remove"),
            });
            return;
        }
        super.removeChild(child);
    }
}