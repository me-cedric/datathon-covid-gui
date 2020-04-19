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
