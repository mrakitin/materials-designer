/* eslint-disable no-unused-vars */
import lodash from "lodash";
// eslint-disable-next-line import/no-unresolved
import random from "random-seed";
import _ from "underscore";

import { getCacheValue } from "./cache";

/**
 * Checks whether passed string is integer number.
 */
function isInteger(str) {
    return /^\d+$/.test(str);
}

/**
 * Evaluates expression from passed string.
 * See https://www.jayway.com/2012/04/03/cucumber-data-driven-testing-tips/ for more information.
 * The rules are:
 *  - ${} – everything inside will be parsed, strings are comma separated
 *  - numerical value – create random alphanumeric string
 *  - ! – use the string as it is
 *  - N – random numbers
 *  - d - date in
 * Math.random().toString(36) is used to generate random string.
 */
function evalExpression(str) {
    if (isInteger(str)) {
        /**
         * Seed is generated by timestamp + random string.
         * Additional random string is required, because using only seed for generating string in loop
         * will cause random string duplication.
         */
        const seed = new Date().getTime().toString() + Math.random().toString(36);
        const rand = random.create(seed);
        const alphabet = "abcdefghijklmnopqrstuvwxyz";
        const randomLetter = alphabet[Math.floor(rand.random() * alphabet.length)];
        // !!!IMPORTANT Random letter is required in generated string because of
        // issue https://exabyte.atlassian.net/browse/SOF-1719
        // Generated string is used for username generation. In case of random string contains only numbers
        // slug for default issue will be inappropriate (e.g., "user-1232" has "user" slug).
        return (
            randomLetter +
            rand
                .random()
                .toString(36)
                .substring(2, 2 + parseInt(str) - 1)
        );
    }
    if (str.indexOf("!") === 0) {
        // ! – use the string as it is
        return str.substring(1);
    }
    if (str.indexOf("N") === 0) {
        // random numbers
        let result = "";
        const max = 9;
        const min = 0;
        const count = parseInt(str.substring(1));
        let i = 0;
        for (; i < count; i++) {
            result += Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return result;
    }
}

/**
 * Parses passed string and returns evaluated value.
 */
export function parseValue(str, context, key) {
    if (!_.isString(str)) throw new Error("Argument should be string");
    // eslint-disable-next-line no-shadow, no-use-before-define
    const config = REGEXES.find((config) => str.match(config.regex));
    return config ? config.func(str, config.regex, context) : str;
}

/**
 * @summary Parses values from table rows. Each column's value for each row are parsed by parseValue.
 * @param table {Object} Table passed from Cucumber step definition.
 * @param context {Any} Context for extracting cached values.
 * @return {Object}
 */
export function parseTable(table, context) {
    return table
        .hashes()
        .map((hash) => _.mapObject(hash, (value, key) => parseValue(value, context, key)));
}

/**
 * Parses basis string in format "Si 0 0 0, Li 0.5 0.5 0.5" and returns it as an object in exabyte internal format.
 */
function parseBasisStr(str) {
    const lines = str.split(/[,;]/).map((x) => x.trim());
    const basis = {
        elements: [],
        coordinates: [],
        units: "crystal",
    };
    for (let i = 0; i < lines.length; i++) {
        const items = lines[i].split(" ");
        basis.elements.push({
            id: i + 1,
            value: items[0],
        });
        basis.coordinates.push({
            id: i + 1,
            value: [items[1], items[2], items[3]].map(parseFloat),
        });
    }
    return basis;
}

const REGEXES = [
    {
        name: "DATE_REGEX",
        regex: /^\$DATE\{(.*)}/,
        func: (str, regex) => new Date(str.match(regex)[1]),
    },
    {
        name: "BOOLEAN_REGEX",
        regex: /^\$BOOLEAN\{(.*)}/,
        func: (str, regex) => JSON.parse(str.match(regex)[1]),
    },
    {
        name: "ARRAY_REGEX",
        regex: /^\$ARRAY\{(.*)}/,
        func: (str, regex) => str.match(regex)[1].split(","),
    },
    {
        name: "INT_REGEX",
        regex: /^\$INT\{(.*)}/,
        func: (str, regex) => parseInt(str.match(regex)[1]),
    },
    {
        name: "FLOAT_REGEX",
        regex: /^\$FLOAT\{(.*)}/,
        func: (str, regex) => parseFloat(str.match(regex)[1]),
    },
    {
        name: "BASIS_REGEX",
        regex: /^\$BASIS\{(.*)}/,
        func: (str, regex) => parseBasisStr(str.match(regex)[1]),
    },
    {
        name: "EXPR_REGEX",
        regex: /^\$\{(.*)}/,
        func: (str, regex, context) => {
            const value = str.match(regex)[1];
            return value
                .split(",")
                .map(evalExpression)
                .reduceRight((mem, part) => part + mem, "");
        },
    },
    {
        name: "CACHE_REGEX",
        // eslint-disable-next-line no-useless-escape
        regex: /\$CACHE\{([^\{^}]*)}/,
        func: (str, regex, context) => {
            const value = str.match(regex)[1];
            const [contextKey, property] = value.split(":");
            return parseValue(
                str.replace(
                    `$CACHE{${value}}`,
                    lodash.get(getCacheValue(context, contextKey), property),
                ),
                context,
            );
        },
    },
];
