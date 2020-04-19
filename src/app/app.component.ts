import { Component, ViewChild, OnInit } from '@angular/core'
import { FormGroup, Validators, FormBuilder } from '@angular/forms'
import { MatStep, MatStepper } from '@angular/material/stepper'

import { ApiService } from './api.service'
import { map, catchError } from 'rxjs/operators'
import { HttpErrorResponse, HttpEventType } from '@angular/common/http'
import { of, forkJoin } from 'rxjs'

interface FileMetadata {
  data: File
  inProgress: boolean
  progress: number
}
interface ApiResults {
  url: string
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
    this.files.forEach((meta: FileMetadata) => {
      uploads.push(this.uploadFile(meta))
    })
    forkJoin(uploads).subscribe((events: any[]) => {
      const resultingIds: string[] = []
      events.forEach((event) => {
        if (typeof event === 'object' && event.body) {
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
            console.log(event.body)
          }),
          catchError((error: HttpErrorResponse) => {
            return of(`Handling upload failed.`)
          })
        )
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
