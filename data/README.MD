# Database

## How to format the data

 - Raw data is not stored on this repository and must be retrived from [the project instructions](https://github.com/ossef/Solution_Factory_IT/tree/main/Version2_Version3/Data.md)
 - Place all the txt files in the `data/raw` folder
 - Run `npm run db:format`


## CLI Options
When running `format.js` or `npm run db:format`, you can use the following options:
 - `--import`: Specify the precise datasets you want to import.
 - `--exclude`: Specify datasets to exclude from the import.
 **The `import` flag has priority over the `exclude` flag.**

### Available Datasets
 - `routes`
 - `trips`
 - `stop_times`
 - `stops`
 - `transfers`
