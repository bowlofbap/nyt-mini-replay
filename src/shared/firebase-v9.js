// Firebase v9 modular SDK approach
// Using fetch API to directly communicate with Firestore REST API

class FirebaseRESTManager {
  constructor() {
    this.projectId = CONSTANTS.FIREBASE_CONFIG.projectId;
    this.apiKey = CONSTANTS.FIREBASE_CONFIG.apiKey;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  async uploadRecording(recordingData) {
    try {
      const replayId = this.generateReplayId();
      
      const firestoreData = this.convertToFirestoreFormat({
        ...recordingData,
        uploadedAt: new Date().toISOString(),
        version: '1.0'
      });

      const response = await fetch(`${this.baseUrl}/recordings/${replayId}?key=${this.apiKey}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: firestoreData
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true, replayId };
    } catch (error) {
      throw error;
    }
  }

  async downloadRecording(replayId) {
    try {
      const response = await fetch(`${this.baseUrl}/recordings/${replayId}?key=${this.apiKey}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Recording not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.convertFromFirestoreFormat(data.fields);
    } catch (error) {
      throw error;
    }
  }

  convertToFirestoreFormat(obj) {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        result[key] = { nullValue: null };
      } else if (typeof value === 'string') {
        result[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        result[key] = { doubleValue: value };
      } else if (typeof value === 'boolean') {
        result[key] = { booleanValue: value };
      } else if (Array.isArray(value)) {
        result[key] = {
          arrayValue: {
            values: value.map(item => {
              if (Array.isArray(item)) {
                return {
                  arrayValue: {
                    values: item.map(subItem => ({ doubleValue: subItem }))
                  }
                };
              } else if (typeof item === 'object') {
                return { mapValue: { fields: this.convertToFirestoreFormat(item) } };
              } else if (typeof item === 'string') {
                return { stringValue: item };
              } else if (typeof item === 'number') {
                return { doubleValue: item };
              }
              return { stringValue: String(item) };
            })
          }
        };
      } else if (typeof value === 'object') {
        result[key] = { mapValue: { fields: this.convertToFirestoreFormat(value) } };
      } else {
        result[key] = { stringValue: String(value) };
      }
    }
    
    return result;
  }

  convertFromFirestoreFormat(fields) {
    const result = {};
    
    for (const [key, value] of Object.entries(fields)) {
      if (value.stringValue !== undefined) {
        result[key] = value.stringValue;
      } else if (value.doubleValue !== undefined) {
        result[key] = value.doubleValue;
      } else if (value.booleanValue !== undefined) {
        result[key] = value.booleanValue;
      } else if (value.nullValue !== undefined) {
        result[key] = null;
      } else if (value.arrayValue) {
        result[key] = value.arrayValue.values.map(item => {
          if (item.arrayValue) {
            return item.arrayValue.values.map(subItem => subItem.doubleValue || subItem.stringValue);
          } else if (item.mapValue) {
            return this.convertFromFirestoreFormat(item.mapValue.fields);
          } else {
            return item.doubleValue || item.stringValue || item.booleanValue;
          }
        });
      } else if (value.mapValue) {
        result[key] = this.convertFromFirestoreFormat(value.mapValue.fields);
      }
    }
    
    return result;
  }

  generateReplayId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `${timestamp}-${random}`;
  }
}

// Create global instance
const firebaseRESTManager = new FirebaseRESTManager();