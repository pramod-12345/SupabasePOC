import React, { useState, useEffect } from "react";
import { View, Alert, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Button, TextInput, Card, ActivityIndicator, Text, Avatar } from "react-native-paper";
import { launchImageLibrary } from "react-native-image-picker";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`username, website, avatar_url,full_name`)
        .eq("id", session?.user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
        setFullName(data.full_name);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url: avatarUrl,
        updated_at: new Date(),
        full_name: fullName,
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(uri: string) {
    try {
      if (!session?.user) throw new Error("No user found");

      const fileExt = uri.split(".").pop();
      const fileName = `${session.user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error } = await supabase.storage.from("avatars").upload(filePath, {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      });

      if (error) throw error;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);

      await updateProfile();
    } catch (error) {
      Alert.alert("Error", "Failed to upload image");
    }
  }

  function pickImage() {
    launchImageLibrary({ mediaType: "photo", quality: 0.5 }, (response) => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        setAvatarUrl(imageUri);
        // uploadAvatar(imageUri);
      }
    });
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        {/* Avatar on Top */}
        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <Avatar.Icon size={100} icon="account-circle" />
          )}
        </TouchableOpacity>

        {/* Profile Details */}
        <Card.Title title="Your Profile" subtitle={session?.user?.email} />
        <Card.Content>
          <TextInput
            label="Username"
            value={username}
            mode="outlined"
            placeholderTextColor={"#000000"}
            onChangeText={setUsername}
            style={styles.input}
          />
          <TextInput
            label="Full Name"
            value={fullName}
            mode="outlined"     
            placeholderTextColor={"#000000"}
            onChangeText={setFullName}
            style={styles.input}
          />
          <TextInput
            label="Website"
            value={website}
            mode="outlined"
            placeholderTextColor={"#000000"}
            onChangeText={setWebsite}
            style={styles.input}
          />
        </Card.Content>
      </Card>

      <Button mode="contained" onPress={updateProfile} loading={loading} style={styles.button}>
        {loading ? "Updating..." : "Update Profile"}
      </Button>

      <Button mode="outlined" onPress={() => supabase.auth.signOut()} style={styles.logoutButton}>
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
  },
  card: {
    marginBottom: 20,
    paddingBottom: 10,
  },
  avatarContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ddd",
  },
  input: {
    marginVertical: 10,
    color: '#000',

  },
  button: {
    marginTop: 10,
    backgroundColor: "#007bff",
  },
  logoutButton: {
    marginTop: 10,
    borderColor: "#dc3545",
    borderWidth: 1,
  },
});
