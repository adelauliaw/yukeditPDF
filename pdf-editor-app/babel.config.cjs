// babel.config.cjs
module.exports = {
  presets: ['@vue/cli-plugin-babel/preset'],
  plugins: [ // plugins
   '@babel/plugin-transform-runtime', 
   '@babel/plugin-proposal-class-properties',
   '@babel/plugin-transform-regenerator'
 ]
};
