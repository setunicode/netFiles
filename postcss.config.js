const TailwindExtractor = content => {
  return content.match(/[A-Za-z0-9-_:/]+/g) || [];
};

const options = {
  plugins: [
    require('tailwindcss')('./tailwind.config.js'),
    require('postcss-preset-env')
  ]
};

if (process.env.NODE_ENV === 'development') {
  options.map = { inline: true };
} else {
  options.plugins.push(
    require('@fullhuman/postcss-purgecss')({
      content: [
        './app/*.js',
        './app/ui/*.js'
      ],
      extractors: [
        {
          extractor: TailwindExtractor,
          extensions: ['js']
        }
      ]
    })
  );
  options.plugins.push(
    require('cssnano')({
      preset: 'default'
    })
  );
}

module.exports = options;
