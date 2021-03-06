// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  serverUrl: 'http://localhost:8000/api/',
  // serverUrl: 'https://gpuvm1v100.eastus.cloudapp.azure.com/api/',
  uploadUrl: 'upload',
  statusUrl: 'status',
  segmentationUrl: 'segmentation',
  classificationUrl: 'classification',
  apiBasicAuth: 'admin:c1a10bf6cc05f24d06ba834670b4861e0a985f09'
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
