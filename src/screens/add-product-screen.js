import React, {useState} from 'react';
import {StyleSheet, SafeAreaView, ScrollView, Image} from 'react-native';
import {Button} from 'react-native-elements';
import t from 'tcomb-form-native';
import { Auth, API, graphqlOperation} from 'aws-amplify';
import {createProduct} from '../graphql/mutations';
import ImageUploader from '../components/ImageUploader'
import {launchImageLibrary} from 'react-native-image-picker'; 
import {Storage} from 'aws-amplify';
import * as ImagePicker from 'expo-image-picker';

const Form = t.form.Form;
const User = t.struct({
  name: t.String,
  price: t.Number,
  description: t.String,
});
const AddProductScreen = ({navigation}) => {
  const [form, setForm] = useState(null); 
  const [initialValues, setInitialValues] = useState({});
  const [photo, setPhoto] = useState(null);

  const handleChoosePhoto = async () => {
    const product = await form.getValue();

    setInitialValues({
      name: product?.name,
      price: product.price,
      description: product.description,
    });
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    console.log(result);

    if (!result.cancelled) {
      setPhoto(result.uri);
    }
  };

  const options = {
    auto: 'placeholders',
    fields: {
      description: {
        multiLine: true,
        stylesheet: {
          ...Form.stylesheet,
          textbox: {
            ...Form.stylesheet.textbox,
            normal: {
              ...Form.stylesheet.textbox.normal,
              height: 100,
              textAlignVertical: 'top',
            },
          },
        },
      },
    },
  };
  const handleSubmit = async () => {
    try {
      const value = await form.getValue();
      console.log('value: ', value);
      const user = await Auth.currentAuthenticatedUser();
      if (photo) {
        const response = await fetch(photo);
  
        const blob = await response.blob();
        console.log('FileName: \n');
        await Storage.put(photo, blob, {
          contentType: 'image/jpeg',
        });
      }
      const response = await API.graphql(
        graphqlOperation(createProduct, {
          input: {
            name: value.name,
            price: value.price.toFixed(2),
            description: value.description,
            userId: user.attributes.sub,
            userName: user.username,
            image: photo,
          },
        }),
      );
      console.log('Response :\n');
      console.log(response);
      navigation.navigate('Home');
    } catch (e) {
      console.log(e.message);
    }
  };
return (
    <>
      <SafeAreaView style={styles.addProductView}>
        <ScrollView>
          <Form
            ref={(c) => setForm(c)}
            value={initialValues}
            type={User}
            options={options}
          />
          <Button title="Choose Photo" onPress={handleChoosePhoto} />
          {photo ? <Image source={{uri: photo}} style={styles.photo} /> : <></> }
          <Button title="Save" onPress={handleSubmit} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};
const styles = StyleSheet.create({
  addProductView: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingTop: 15,
    height: 'auto',
  },
  photo: {
    width: 200,
    height: 200,
  },
});
export default AddProductScreen;