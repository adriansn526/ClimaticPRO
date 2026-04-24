const stringSimilarity = require('string-similarity');

const sanitize = (str) => str.toLowerCase().replace(/[\s\-_]+/g, ' ').replace(/[^\w\s]/g, '').trim();

const ext = "Instalatie de aer conditionat Aparat de aer conditionat Gree Pulsar GWH12AGB-K6DNA1A Inverter 12000 BTU, kit de instalare inclus";
const int = "Aparat de aer conditionat, Gree, Pulsar GWH12AGB-K6DNA1A, 12000 BTU, Clasa A++, Ionizare aer, Inverter, Wi-Fi, kit instalare";

const cleanExt = sanitize(ext);
const cleanInt = sanitize(int);

console.log("Ext:", cleanExt);
console.log("Int:", cleanInt);
console.log("Score:", stringSimilarity.compareTwoStrings(cleanExt, cleanInt));
