// babel.config.js
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset' 
  ],
  plugins: [
    // ... other plugins ...
    '@babel/plugin-transform-private-methods'  // Add this line
  ]
};
