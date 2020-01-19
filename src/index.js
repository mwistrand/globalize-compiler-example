const Globalize = require('globalize');

Globalize.locale('en');

const cldrData = __CLDR_DATA__;
if (cldrData) {
	Globalize.load(cldrData);
}

[
	Globalize.dateFormatter({datetime: 'medium'})(new Date()),
	Globalize.dateToPartsFormatter()(new Date()),
	Globalize.dateParser({skeleton: "GyMMMd"})("Nov 30, 2010 AD"),
	Globalize.numberFormatter({maximumFractionDigits: 5})(Math.PI),
	Globalize.numberParser({style: "percent"})("50%"),
	Globalize.currencyFormatter("USD", {style: "code"})(69900),
	Globalize.pluralGenerator({type: "ordinal"})(2),
	Globalize.relativeTimeFormatter("month")(3),
	Globalize.unitFormatter("second", {form: "narrow"})(10)
].forEach(value => console.log(value));
