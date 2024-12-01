import { StepOptions } from "shepherd.js";
import { waitForElement } from "./utils";

export const createAttackArmySteps: StepOptions[] = [
  {
    title: "Conquest in Eternum",
    text: "Create an attacking army to conquer your enemies and expand your influence across the realm.",
    buttons: [
      {
        text: "Next",
        action: function () {
          return this.next();
        },
      },
    ],
  },
  {
    title: "Military Menu",
    text: "Open the military menu to manage your armies",
    attachTo: {
      element: ".military-selector",
      on: "top",
    },
    advanceOn: {
      selector: ".military-selector",
      event: "click",
    },
    buttons: [
      {
        text: "Prev",
        action: function () {
          return this.back();
        },
      },
    ],
  },
  {
    title: "Create Attack Army",
    text: "Click here to create a new attacking army to conquer the map",
    attachTo: {
      element: ".attack-army-selector",
      on: "top",
    },
    beforeShowPromise: function () {
      return waitForElement(".attack-army-selector");
    },
    advanceOn: {
      selector: ".attack-army-selector",
      event: "click",
    },
    buttons: [
      {
        text: "Prev",
        action: function () {
          return this.back();
        },
      },
    ],
  },
  {
    title: "Assign Troops",
    text: "Assign troops to your attacking army. The stronger your army, the more territory you can conquer!",
    attachTo: {
      element: ".attacking-army-selector",
      on: "top",
    },
    beforeShowPromise: function () {
      return waitForElement(".attacking-army-selector");
    },
    buttons: [
      {
        text: "Prev",
        action: function () {
          return this.back();
        },
      },
      {
        text: "Finish",
        action: function () {
          return this.complete();
        },
      },
    ],
  },
];
