import "./polyfills";
import express from "express";
import { Temporal } from "@js-temporal/polyfill";

// Refactor the following code to get rid of the legacy Date class.
// Use Temporal.PlainDate instead. See /test/date_conversion.spec.mjs for examples.

function createApp(database) {
  const app = express();

  app.put("/prices", (req, res) => {
    const type = req.query.type;
    const cost = parseInt(req.query.cost);
    database.setBasePrice(type, cost);
    res.json();
  });

  app.get("/prices", (req, res) => {
    const age = req.query.age ? parseInt(req.query.age) : undefined;
    const type = req.query.type;
    const baseCost = database.findBasePriceByType(type).cost;
    const date = parsePlainDate(req.query.date);
    const cost = calculateCost(age, type, baseCost, date);
    res.json({ cost });
  });

  function parsePlainDate(dateString) {
      if (dateString){
        return Temporal.PlainDate.from(dateString);
      }
  }
  function parseDate(dateString) {
    if (dateString) {
      return new Date(dateString);
    }
  }

  function calculateCost(age, type,baseCost, date) {
    if (type === "night") {
      return calculateCostForNightTicket(age, baseCost);
    } else {
      return calculateCostForDayTicket(age,baseCost, date);
    }
  }

  function calculateCostForNightTicket(age, baseCost) {
    if (age === undefined) {
      return 0;
    }
    if (age < 6) {
      return 0;
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.4);
    }
    return baseCost;
  }

  function calculateCostForDayTicket(age,baseCost, date2) {
    let reduction = calculateReduction(date2);
    if (age === undefined) {
      return Math.ceil(baseCost * (1 - reduction / 100));
    }
    if (age < 6) {
      return 0;
    }
    if (age < 15) {
      return Math.ceil(baseCost * 0.7);
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.75 * (1 - reduction / 100));
    }
    return Math.ceil(baseCost * (1 - reduction / 100));
  }

  function calculateReduction(date2) {
    let reduction = 0;
    if (date2 && isMonday(date2) && !isHoliday(date2)) {
      reduction = 35;
    }
    return reduction;
  }

  function isMonday(date2) {
    return date2.dayOfWeek === 1;
  }

  function isHoliday(date2) {
    const holidays = database.getHolidays();
    for (let row of holidays) {
      let holiday2 = Temporal.PlainDate.from(row.holiday);
      if (
        date2 &&
        date2.year === holiday2.year &&
        date2.dayOfYear  === holiday2.dayOfYear
      ) {
        return true;
      }
    }
    return false;
  }

  return app;
}

export { createApp };
