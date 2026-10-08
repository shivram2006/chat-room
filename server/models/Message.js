import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileType: { type: String, default: '' }, // 'image', 'video', 'audio', 'document', ''
    fileSize: { type: Number, default: 0 },
    replyTo: {
      id: { type: String, default: '' },
      text: { type: String, default: '' },
      senderName: { type: String, default: '' },
      fileType: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
