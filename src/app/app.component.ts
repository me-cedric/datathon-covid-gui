import { Component, ViewChild, OnInit } from '@angular/core'
import { FormGroup, Validators, FormBuilder } from '@angular/forms'
import { MatStep, MatStepper } from '@angular/material/stepper'

import { ApiService } from './api.service'
import { map, catchError } from 'rxjs/operators'
import { HttpErrorResponse, HttpEventType } from '@angular/common/http'
import { of, forkJoin, timer, Subscription } from 'rxjs'

interface FileMetadata {
  data: File
  inProgress: boolean
  progress: number
}
interface ApiResults {
  pk: string
  algotype: 'classification' | 'segmentation'
  value: boolean
  results: {
    source: string
    result: string
    metadata: any
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // File Types
  allowedFileTypes = '.png,.jpg,.jpeg,.nii,.nii.gz'

  // form groupo to valdiate presence of file
  imageFormGroup: FormGroup
  // List of file
  files: FileMetadata[] = []
  // Are we waiting for the results
  loading = true
  // Available checks
  availableChecks: { label: string; value: string }[] = [
    { label: 'Classification', value: 'classification' },
    { label: 'Segmentation', value: 'segmentation' }
  ]
  // Api results
  results: ApiResults[] = []
  statusTimer: Subscription
  step = 0
  error = ''

  // Steppers
  @ViewChild('stepper') stepper: MatStepper
  @ViewChild('imageStep') imageStep: MatStep
  @ViewChild('resultStep') resultStep: MatStep

  // Convenience getter for easy access to form fields
  get fields() {
    return this.imageFormGroup.controls
  }

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {}

  algoType(algoValue: string) {
    const filtered = this.availableChecks.filter(
      (algo) => algo.value === algoValue
    )
    return filtered[0] ? filtered[0].label : ''
  }

  setStep(index: number) {
    this.step = index
  }
  nextStep() {
    this.step++
  }
  prevStep() {
    this.step--
  }

  metaColumns(metadata: {}): string[] {
    let col = []
    if (metadata) {
      col = Object.keys(metadata)
    }
    return col
  }

  dataSourcer(metadata: { [x: string]: any }) {
    const data = []
    if (metadata) {
      Object.keys(metadata).forEach((meta) => {
        data.push({ type: meta, value: metadata[meta] })
      })
    }
    return data
  }

  /**
   * Add a file
   * event: { addedFiles: any }
   */
  onSelect(event: { addedFiles: any }) {
    const added = event.addedFiles.map((file: File) => ({
      data: file,
      inProgress: false,
      progress: 0
    }))
    this.files.push(...added)
    this.validate()
  }

  /**
   * Remove a file
   * event: File
   */
  onRemove(event: FileMetadata) {
    this.files.splice(this.files.indexOf(event), 1)
    this.validate()
  }

  /**
   * Validate presence of file
   */
  validate() {
    if (this.files.length > 0) {
      this.imageFormGroup.patchValue({
        files: true
      })
    } else {
      this.imageFormGroup.patchValue({
        files: null
      })
    }
  }

  /**
   * Reset the images
   */
  reset() {
    this.files = []
    this.stepper.reset()
  }

  /**
   * Check if file is an image or not for the preview
   */
  isFileImage = (file: File) => file && file.type.split('/')[0] === 'image'

  submit() {
    const uploads = []
    this.results = []
    this.results = JSON.parse(
      '[{"pk":12,"algotype":"segmentation","value":true,"results":[{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z001.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z001.png","metadata":{"percentage of diseased area":0}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z002.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z002.png","metadata":{"percentage of diseased area":0}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z003.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z003.png","metadata":{"percentage of diseased area":1.1124220461823697}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z004.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z004.png","metadata":{"percentage of diseased area":0}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z005.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z005.png","metadata":{"percentage of diseased area":0}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z006.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z006.png","metadata":{"percentage of diseased area":0.37920489296636084}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z007.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z007.png","metadata":{"percentage of diseased area":0}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z008.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z008.png","metadata":{"percentage of diseased area":0.7902632802265139}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z009.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z009.png","metadata":{"percentage of diseased area":0}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z010.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z010.png","metadata":{"percentage of diseased area":0.48627292067672984}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z011.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z011.png","metadata":{"percentage of diseased area":0.22236437296292913}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z012.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z012.png","metadata":{"percentage of diseased area":0.5425982216414307}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z013.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z013.png","metadata":{"percentage of diseased area":6.510022567370237}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z014.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z014.png","metadata":{"percentage of diseased area":2.6318513534496146}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z015.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z015.png","metadata":{"percentage of diseased area":0.06595302115569986}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z016.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z016.png","metadata":{"percentage of diseased area":2.609616189467983}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z017.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z017.png","metadata":{"percentage of diseased area":0.9757416373780323}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z018.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z018.png","metadata":{"percentage of diseased area":2.753529086405502}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z019.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z019.png","metadata":{"percentage of diseased area":1.6194817658349328}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z020.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z020.png","metadata":{"percentage of diseased area":0.7352591253033837}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z021.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z021.png","metadata":{"percentage of diseased area":0.8461836873242169}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z022.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z022.png","metadata":{"percentage of diseased area":4.6478116451738964}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z023.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z023.png","metadata":{"percentage of diseased area":6.968291166483333}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z024.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z024.png","metadata":{"percentage of diseased area":7.951307951307951}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z025.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z025.png","metadata":{"percentage of diseased area":3.7216632319068976}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z026.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z026.png","metadata":{"percentage of diseased area":1.5447842378822676}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z027.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z027.png","metadata":{"percentage of diseased area":1.2669573643410852}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z028.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z028.png","metadata":{"percentage of diseased area":3.669453785331273}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z029.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z029.png","metadata":{"percentage of diseased area":9.379148597220993}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z030.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z030.png","metadata":{"percentage of diseased area":4.762846283969331}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z031.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z031.png","metadata":{"percentage of diseased area":3.4543139127666347}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z032.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z032.png","metadata":{"percentage of diseased area":2.2165730086522166}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z033.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z033.png","metadata":{"percentage of diseased area":0.48168087007693816}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z034.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z034.png","metadata":{"percentage of diseased area":2.5452402261465585}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z035.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z035.png","metadata":{"percentage of diseased area":2.8497740642851053}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z036.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z036.png","metadata":{"percentage of diseased area":5.730850242956351}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z037.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z037.png","metadata":{"percentage of diseased area":7.58205565019875}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z038.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z038.png","metadata":{"percentage of diseased area":3.173354979453097}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z039.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z039.png","metadata":{"percentage of diseased area":5.018845467169212}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z040.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z040.png","metadata":{"percentage of diseased area":10.124007611049144}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z041.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z041.png","metadata":{"percentage of diseased area":15.688769912669505}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z042.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z042.png","metadata":{"percentage of diseased area":0}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z043.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z043.png","metadata":{"percentage of diseased area":0}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z044.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z044.png","metadata":{"percentage of diseased area":0}},{"source":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/ready_for_segmentation/1_z045.png","result":"https://gpuvm1v100.eastus.cloudapp.azure.com/api/images/non-covid-case/res_1_z045.png","metadata":{"percentage of diseased area":11.996735582154516}}]}]'
    )
    this.loading = true
    this.error = ''
    this.files.forEach((meta: FileMetadata) => {
      uploads.push(this.uploadFile(meta))
    })
    forkJoin(uploads).subscribe((events: any[]) => {
      const resultingIds: string[] = []
      events.forEach((event) => {
        if (typeof event === 'object' && event.body) {
          console.log(event.body)
          if (Array.isArray(event.body)) {
            resultingIds.push(event.body.map((medFile) => medFile.pk))
          } else {
            resultingIds.push(event.body.pk)
          }
        }
      })
      this.stepper.next()
      // Trigger the call to strat handling the images
      const formData = new FormData()
      formData.append('ids', JSON.stringify(resultingIds))
      return this.apiService
        .triggerModel(formData, this.fields.checkRadio.value)
        .pipe(
          map((event: any) => {
            if (event.type === HttpEventType.Response) {
              return event
            }
          }),
          catchError((error: HttpErrorResponse) => {
            this.loading = false
            this.error = 'Handling upload failed.'
            return of(`Handling upload failed.`)
          })
        )
        .subscribe((evts: any) => {
          if (evts && evts.body) {
            console.log(evts)
            this.statusTimer = timer(2000, 5000).subscribe((t) => {
              const idsData = new FormData()
              idsData.append(
                'statusKeys',
                JSON.stringify(evts.body.map((status: any) => status.pk))
              )
              this.apiService
                .checkStatus(idsData)
                .pipe(
                  map((event: any) => {
                    if (event.type === HttpEventType.Response) {
                      console.log(event)
                      return event
                    }
                  }),
                  catchError((error: HttpErrorResponse) => {
                    this.loading = false
                    this.error = 'Getting results failed.'
                    return of(`Getting results failed.`)
                  })
                )
                .subscribe((e: any) => {
                  if (e && e.body) {
                    const stopCheckIds = []
                    e.body.forEach((status: any) => {
                      if (status.value) {
                        this.results.push(status)
                        stopCheckIds.push(status.pk)
                      }
                    })
                    evts.body = evts.body.filter(
                      (stat: any) => !stopCheckIds.includes(stat.pk)
                    )
                    if (evts.body.length === 0) {
                      this.statusTimer.unsubscribe()
                      this.loading = false
                    }
                  }
                })
            })
          }
        })
    })
  }

  uploadFile(file: FileMetadata) {
    const formData = new FormData()
    formData.append('file', file.data)
    formData.append('algorithm', this.fields.checkRadio.value)
    file.inProgress = true
    return this.apiService.upload(formData).pipe(
      map((event) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            file.progress = Math.round((event.loaded * 100) / event.total)
            break
          case HttpEventType.Response:
            return event
        }
      }),
      catchError((error: HttpErrorResponse) => {
        file.inProgress = false
        return of(`${file.data.name} upload failed.`)
      })
    )
  }

  ngOnInit() {
    this.imageFormGroup = this.formBuilder.group({
      files: ['', Validators.required],
      checkRadio: ['classification', Validators.required]
    })
  }
}
