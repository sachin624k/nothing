import axios from "axios";
import { useState } from "react";

export default function VideoUpload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Select a video first!");

    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await axios.post("http://localhost:5001/upload", formData);

      console.log(res.data);
      setResult("Video saved → " + res.data.video + "\nAudio saved → " + res.data.audio);
    } catch (err) {
      console.error(err);
      alert("Upload failed!");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Upload Video</h2>

      <input type="file" onChange={e => setFile(e.target.files[0])} />

      <br /><br />

      <button onClick={handleUpload}>Upload</button>

      <br /><br />

      {result && <pre>{result}</pre>}
    </div>
  );
}
