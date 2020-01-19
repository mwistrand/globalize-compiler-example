const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency');
const webpackMissingModule = require('webpack/lib/dependencies/WebpackMissingModule');

class InjectedModuleDependency extends ModuleDependency {
}

InjectedModuleDependency.Template = class {
	apply(dep, source) {
		const content = dep.module
			? `__webpack_require__(${JSON.stringify(dep.module.id)});`
			: webpackMissingModule.module(dep.request);

		const prefix = dep.variable ? `var ${dep.variable} = ` : '';
		source.insert(0, `${prefix}${content}\n`);
	}
};

module.exports = InjectedModuleDependency;
