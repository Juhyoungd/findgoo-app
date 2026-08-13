import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/src/lib/supabase";

export type PickedImage = ImagePicker.ImagePickerAsset;

export async function pickImage(options: { square?: boolean } = {}) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { asset: null, error: "사진을 선택하려면 사진 보관함 권한을 허용해주세요." };
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: options.square ?? false,
    aspect: options.square ? [1, 1] : undefined,
    quality: 0.78,
  });
  if (result.canceled || !result.assets[0]) return { asset: null, error: null };
  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > 8 * 1024 * 1024) return { asset: null, error: "이미지는 8MB 이하만 전송할 수 있어요." };
  return { asset, error: null };
}

async function assetBody(asset: PickedImage) {
  if (Platform.OS === "web" && asset.file) return asset.file;
  const response = await fetch(asset.uri);
  return response.arrayBuffer();
}

function safeExtension(asset: PickedImage) {
  const candidate = asset.fileName?.split(".").pop()?.toLowerCase();
  if (candidate && /^[a-z0-9]{2,5}$/.test(candidate)) return candidate;
  return asset.mimeType === "image/png" ? "png" : "jpg";
}

export async function uploadAvatar(asset: PickedImage, userId: string) {
  const path = `${userId}/avatar-${Date.now()}.${safeExtension(asset)}`;
  const { error } = await supabase.storage.from("avatars").upload(path, await assetBody(asset), {
    contentType: asset.mimeType ?? "image/jpeg",
    upsert: true,
  });
  if (error) return { url: null, error: error.message };
  return { url: supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl, error: null };
}

export async function uploadChatImage(asset: PickedImage, conversationId: string, userId: string) {
  const path = `${conversationId}/${userId}-${Date.now()}.${safeExtension(asset)}`;
  const { error } = await supabase.storage.from("chat-media").upload(path, await assetBody(asset), {
    contentType: asset.mimeType ?? "image/jpeg",
    upsert: false,
  });
  if (error) return { path: null, url: null, error: error.message };
  const { data, error: signedError } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 60 * 24);
  return { path, url: data?.signedUrl ?? null, error: signedError?.message ?? null };
}

export async function signChatImage(path: string) {
  const { data, error } = await supabase.storage.from("chat-media").createSignedUrl(path, 60 * 60 * 24);
  return { url: data?.signedUrl ?? null, error: error?.message ?? null };
}
