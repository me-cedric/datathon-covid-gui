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

/**
 * proper asynchrounous forEach
 * array
 * callback
 */
const asyncForEach = async (
  array: any[],
  callback: (obj: any, index: number, array: any[]) => {}
) => {
  for (let index = 0; index < array.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array)
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // File Types
  allowedFileTypes = 'image/*,application/x-zip-compressed,.nii,.nii.gz'

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
    console.log(uploads)
    forkJoin(uploads).subscribe((events: any[]) => {
      events.forEach((event) => {
        if (typeof event === 'object') {
          console.log(event.body)
        }
      })
      this.stepper.next()
    })
    // this.fields.checkRadio.value
    // this.files
  }

  uploadFile(file: FileMetadata) {
    const formData = new FormData()
    formData.append('file', file.data)
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
