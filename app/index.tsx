import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Camera,
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null); // Updated ref for Camera component
  const navigation = useNavigation();

  useEffect(() => {
    // Request permission once when the component mounts
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          skipProcessing: true,
          exif: false,
          base64: false,
        });

        if (photo?.uri) {
          //@ts-ignore
          navigation.navigate("preview", {
            imageUri: photo.uri,
            caption: "Captured using MyApp 📸",
          });
        } else {
          Alert.alert("Error", "Failed to capture the photo.");
        }
      }
    } catch (error) {
      console.error("Error capturing the photo:", error);
      Alert.alert("Error", "An error occurred while capturing the photo.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing={facing}
        enableTorch={flash === "on"}
        zoom={0}
        ratio="16:9"
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleFlash}>
            <View style={styles.sideButtons}>
              <Ionicons
                name={flash === "on" ? "flash-outline" : "flash-off-outline"}
                size={32}
                color="black"
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <View style={styles.captureButton} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <View style={styles.sideButtons}>
              <Ionicons name="camera-reverse-outline" size={32} color="black" />
            </View>
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "space-around",
    position: "absolute",
    bottom: 30,
    width: "100%",
  },
  button: {
    alignItems: "center",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    borderWidth: 4,
    borderColor: "gray",
  },
  text: {
    fontSize: 18,
    color: "#000",
  },
  sideButtons: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
});
