const cldr = require('cldr-data');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const fs = require('fs');
const Globalize = require('globalize');
const globalizeCompiler = require('globalize-compiler');
const merge = require('lodash.merge');
const os = require('os');
const path = require('path');
const {DefinePlugin} = require('webpack');
const NormalModuleReplacementPlugin = require('webpack/lib/NormalModuleReplacementPlugin');
const InjectedModuleDependency = require('./InjectedModuleDependency');

const BASE_PATH = process.cwd();

// The methods in src/index.js are hard-coded here to simplify the example.
const GLOBALIZE_STRINGS = [
	'Globalize.dateFormatter({datetime: "medium"})(new Date())',
	'Globalize.dateToPartsFormatter()(new Date())',
	'Globalize.dateParser({skeleton: "GyMMMd"})("Nov 30, 2010 AD")',
	'Globalize.numberFormatter({maximumFractionDigits: 5})(Math.PI)',
	'Globalize.numberParser({style: "percent"})("50%")',
	'Globalize.currencyFormatter("USD", {style: "code"})(69900)',
	'Globalize.pluralGenerator({type: "ordinal"})(2)',
	'Globalize.relativeTimeFormatter("month")(3)',
	'Globalize.unitFormatter("second", {form: "narrow"})(10)'
];

const compileGlobalize = () => {
	Globalize.load(cldr.entireSupplemental());
	Globalize.load(cldr.entireMainFor('en'));

	const template = ({code, dependencies}) => {
		const nodeLocation = `${BASE_PATH}${path.sep}node_modules${path.sep}`;
		return `const Globalize = require('${nodeLocation}globalize${path.sep}dist${path.sep}${dependencies[0]}');
${dependencies.slice(1).map(dep => `require('${nodeLocation}globalize${path.sep}dist${path.sep}${dep}');`).join('\n')}
${code};
		module.exports = Globalize;`
	};

	const extracts = GLOBALIZE_STRINGS.map(signature => globalizeCompiler.extract(signature));
	const extracted = globalizeCompiler.compileExtracts({
		defaultLocale: 'en',
		extracts,
		messages: {
			simpleGuestInfo: '{host} invites {guest} to a party.',
			guestInfo: `{gender, select,
			female {
				{guestCount, plural, offset:1
				=0 {{host} does not host a party.}
				=1 {{host} invites {guest} to her party.}
				=2 {{host} invites {guest} and one other person to her party.}
				other {{host} invites {guest} and # other people to her party.}}}
			male {
				{guestCount, plural, offset:1
				=0 {{host} does not host a party.}
				=1 {{host} invites {guest} to his party.}
				=2 {{host} invites {guest} and one other person to his party.}
				other {{host} invites {guest} and # other people to his party.}}}
			other {
				{guestCount, plural, offset:1
				=0 {{host} does not host a party.}
				=1 {{host} invites {guest} to their party.}
				=2 {{host} invites {guest} and one other person to their party.}
				other {{host} invites {guest} and # other people to their party.}}}}`
		},
		timeZoneData: {},
		template
	});

	const tmpDir = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);
	const file = path.join(tmpDir, 'formatters.js');
	fs.writeFileSync(file, extracted, 'utf8');
	return file;
};

function compileGlobalizePlugin() {
	const compiler = this;
	const nmr = new NormalModuleReplacementPlugin(/(^|[\/\\])globalize$/, 'globalize/dist/globalize-runtime');
	nmr.apply(compiler);
	compiler.hooks.compilation.tap('I18nPlugin', (compilation, params) => {
		compilation.dependencyFactories.set(InjectedModuleDependency, params.normalModuleFactory);
		compilation.dependencyTemplates.set(
			InjectedModuleDependency,
			new InjectedModuleDependency.Template()
		);

		compilation.hooks.succeedModule.tap('I18nPlugin', (module) => {
			if (/src(\/|\\)index\.js/.test(module.resource)) {
				const templateName = compileGlobalize();
				const dep = new InjectedModuleDependency(templateName);
				module.addDependency(dep);
			}
		});
	});
}

function loadCldrData() {
	const cldrData = [
		require('cldr-data/main/en/ca-gregorian.json'),
		require('cldr-data/main/en/currencies.json'),
		require('cldr-data/main/en/dateFields.json'),
		require('cldr-data/main/en/numbers.json'),
		require('cldr-data/main/en/timeZoneNames.json'),
		require('cldr-data/main/en/units.json'),
		require('cldr-data/supplemental/currencyData.json'),
		require('cldr-data/supplemental/likelySubtags.json'),
		require('cldr-data/supplemental/numberingSystems.json'),
		require('cldr-data/supplemental/ordinals.json'),
		require('cldr-data/supplemental/plurals.json'),
		require('cldr-data/supplemental/timeData.json'),
		require('cldr-data/supplemental/weekData.json')
	].reduce((data, source) => merge(data, source), Object.create(null));
	return JSON.stringify(cldrData);
}

module.exports = (env = {}) => {
	return {
		mode: 'production',
		entry: './src/index.js',
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'bundle.js'
		},
		resolveLoader: {
			modules: [path.resolve(__dirname, 'node_modules'), 'node_modules']
		},
		resolve: {
			modules: [BASE_PATH, path.join(BASE_PATH, 'node_modules')],
			extensions: ['.js', '.jsx']
		},
		module: {
			rules: [
				{
					test: /globalize/,
					loader: 'imports-loader?define=>false'
				}
			]
		},
		plugins: [
			new CleanWebpackPlugin(),
			new DefinePlugin({
				__CLDR_DATA__: env.globalize ? null : loadCldrData()
			}),
			env.globalize && compileGlobalizePlugin
		].filter(Boolean)
	};
};
