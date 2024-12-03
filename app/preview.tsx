//@ts-nocheck
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  PanResponder,
  Dimensions,
  Animated,
  Text,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useRoute, useNavigation } from "@react-navigation/native";
import Share from "react-native-share";
import ViewShot, { captureRef } from "react-native-view-shot";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

export default function PreviewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { imageUri } = route.params as { imageUri: string };

  const previewRef = useRef<View>(null);
  const [captions, setCaptions] = useState([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const captionRefs = useRef({});

  // Fetch image dimensions
  useEffect(() => {
    Image.getSize(
      imageUri,
      (width, height) => {
        setImageSize({ width, height });
      },
      (error) => {
        console.error("Could not get image size", error);
      }
    );
  }, [imageUri]);

  const panResponderFor = (id: number) => {
    const scale = captionRefs.current[id]?.scale || new Animated.Value(1);
    captionRefs.current[id] = { ...captionRefs.current[id], scale };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Enlarge the caption when touch begins
        Animated.spring(scale, {
          toValue: 1.2,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        const current = captionRefs.current[id];
        if (current) {
          current.position = {
            x: current.position.x + gestureState.dx,
            y: current.position.y + gestureState.dy,
          };
          setCaptions((prev) =>
            prev.map((caption) =>
              caption.id === id
                ? { ...caption, position: { ...current.position } }
                : caption
            )
          );
        }
      },
      onPanResponderRelease: () => {
        // Restore the original size when touch is released
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      },
    });
  };

  const captureAndShare = async () => {
    try {
      if (!previewRef.current) {
        Alert.alert("Error", "Preview not ready for capture.");
        return;
      }

      // Remove empty captions
      const nonEmptyCaptions = captions.filter(
        (caption) => caption.text.trim() !== ""
      );
      setCaptions(nonEmptyCaptions);

      const capturedUri = await captureRef(previewRef, {
        format: "jpg",
        quality: 1,
      });

      await shareToInstagramStories(capturedUri);
    } catch (error) {
      console.error("Error capturing and sharing:", error);
      Alert.alert("Error", "Failed to capture and share.");
    }
  };

  const shareToInstagramStories = async (fileUri: string) => {
    try {
      const isInstagramInstalled = await Share.isPackageInstalled(
        "com.instagram.android"
      );

      if (!isInstagramInstalled) {
        Alert.alert(
          "Instagram Not Installed",
          "Please install Instagram to share stories."
        );
        return;
      }

      await Share.shareSingle({
        //@ts-ignore
        social: Share.Social.INSTAGRAM_STORIES,
        url: fileUri,
        appId: "189215431793398",
        backgroundImage: fileUri,
        type: "image/*",
      });
    } catch (error) {
      console.error("Error sharing to Instagram Stories:", error);
      Alert.alert(
        "Error",
        "An error occurred while sharing to Instagram Stories."
      );
    }
  };

  const addCaption = () => {
    const newCaption = {
      id: Date.now(),
      text: "",
      position: { x: 100, y: 100 },
    };
    captionRefs.current[newCaption.id] = {
      position: { ...newCaption.position },
      scale: new Animated.Value(1),
    };
    setCaptions((prev) => [...prev, newCaption]);
  };

  const removeCaptionIfEmpty = (id: number) => {
    setCaptions((prev) =>
      prev.filter(
        (caption) => !(caption.id === id && caption.text.trim() === "")
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.previewContainer}>
        <ViewShot ref={previewRef} style={styles.imageContainer}>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                imageSize.width > 0 && {
                  width: imageSize.width,
                  height: imageSize.height,
                },
              ]}
              resizeMode="contain"
            />
          )}
          {captions.map((caption) => (
            <Animated.View
              key={caption.id}
              {...panResponderFor(caption.id).panHandlers}
              style={[
                styles.textOverlay,
                {
                  left: caption.position.x,
                  top: caption.position.y,
                  transform: [{ scale: captionRefs.current[caption.id].scale }],
                },
              ]}
            >
              {/* Dedicated Drag Handler */}

              <TextInput
                style={styles.overlayTextInput}
                value={caption.text}
                onChangeText={(text) =>
                  setCaptions((prev) =>
                    prev.map((cap) =>
                      cap.id === caption.id ? { ...cap, text } : cap
                    )
                  )
                }
                onEndEditing={() => removeCaptionIfEmpty(caption.id)}
                placeholder="Enter caption"
                placeholderTextColor="#aaa"
              />
            </Animated.View>
          ))}
        </ViewShot>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={addCaption}>
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.buttonText}>Add Caption</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={captureAndShare}
          style={{ borderRadius: 10 }}
        >
          <LinearGradient
            colors={["#f58529", "#dd2a7b", "#8134af", "#515bd4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconButton, styles.gradientButton]}
          >
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.buttonText}>Share</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "space-between",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  image: {
    maxWidth: "100%",
    flex: 1,
    maxHeight: "100%",
  },
  textOverlay: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    zIndex: 100,
  },
  dragHandler: {
    marginRight: 8,
    padding: 5,
  },
  overlayTextInput: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: "#121212",
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    marginLeft: 10,
    fontWeight: "600",
  },
});
