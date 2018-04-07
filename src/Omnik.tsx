import React from 'react';
import { Formik, FormikConfig, FormikValues, FormikActions } from './Formik';

const isArray = (val: any) => {
  return Array.isArray(val);
};

const isObject = (val: any) => {
  return typeof val === 'object' && !Array.isArray(val);
};

// tslint:disable-next-line interface-name Because of a lint error we need to investigate
class Omnik<Values = object> extends React.Component<FormikConfig<Values>, {}> {
  private initialValues: FormikValues = {};

  private formikProps: FormikConfig<Values>;

  constructor(props: FormikConfig<Values>) {
    super(props);

    // Set a copy of our initialValues and create a new one without null
    this.initialValues = props.initialValues;
    // Initialize and create the formik props
    this.formikProps = this.initializeFormikProps(props);
  }

  public render() {
    return <Formik {...this.formikProps} />;
  }

  public handleSubmitProxy = (
    values: Values,
    formikActions: FormikActions<Values>
  ) => {
    const { onSubmit } = this.props;

    // Check if we need to reset an empty string with a matching null value
    // in our stored initialValues
    const newValues = this.decodeValues(values);

    onSubmit(newValues, formikActions);
  };

  private encodeNullValues = (values: Values) => {
    const { encodeNullValues } = this;
    const newValues: any = Object.assign({}, values);

    // Iterate each property and check for a null value - then reset
    // to empty string if null is found - iterate recursivly for objects
    Object.keys(newValues).forEach(key => {
      const value: any = newValues[key];
      if (value === null) {
        newValues[key] = '';
      } else if (isObject(value)) {
        newValues[key] = encodeNullValues(value);
      }
    });

    return newValues;
  };

  private decodeNullValues = (
    values: Values,
    matchValues: FormikValues = this.initialValues
  ) => {
    const { decodeNullValues } = this;
    const newValues: any = Object.assign({}, values);

    Object.keys(newValues).forEach(key => {
      const value: any = newValues[key];
      const matchValue = matchValues[key];

      // If we get an empty string - then check in matchValues for a null value
      // to place on key instead of the empty string
      if (typeof value === 'string' && !value && matchValue === null) {
        newValues[key] = null;
      } else {
        if (isObject(value)) {
          newValues[key] = decodeNullValues(value, matchValue);
        }
      }
    });

    return newValues;
  };

  private encodeArrayValues = (values: Values) => {
    const { encodeArrayValues } = this;
    let newValues: any = Object.assign({}, values);

    // Iterate the given values and look for arrays to stringify
    Object.keys(newValues).forEach(key => {
      const value: any = newValues[key];

      if (isArray(value)) {
        newValues[key] = JSON.stringify(value);
      } else if (isObject(value)) {
        newValues[key] = encodeArrayValues(value);
      }
    });

    return newValues;
  };

  private decodeArrayValues = (
    values: Values,
    matchValues: FormikValues = this.initialValues
  ) => {
    const { decodeArrayValues } = this;
    let newValues: any = Object.assign({}, values);

    Object.keys(newValues).forEach(key => {
      const value: any = newValues[key];
      const matchValue = matchValues[key];

      if (isArray(matchValue)) {
        newValues[key] = JSON.parse(value);
      } else if (isObject(value)) {
        newValues[key] = decodeArrayValues(value, matchValues[key]);
      }
    });

    return newValues;
  };

  private encodeValues = (values: Values) => {
    const { encodeNullValues, encodeArrayValues } = this;
    let newValues = Object.assign({}, values);

    // First encode null values
    newValues = encodeNullValues(newValues);

    // Then stringify arrays
    newValues = encodeArrayValues(newValues);

    return newValues;
  };

  private decodeValues = (values: Values) => {
    const { decodeNullValues, decodeArrayValues } = this;
    let newValues = Object.assign({}, values);

    newValues = decodeNullValues(newValues);

    newValues = decodeArrayValues(newValues);

    return newValues;
  };

  private initializeFormikProps = (props: FormikConfig<Values>) => {
    const { encodeValues, handleSubmitProxy } = this;
    const formikProps = { ...props };
    const { initialValues } = props;

    formikProps.initialValues = encodeValues(initialValues);

    // Set a new handleSubmit to proxy
    formikProps.onSubmit = handleSubmitProxy;

    return formikProps;
  };
}

export default Omnik;
