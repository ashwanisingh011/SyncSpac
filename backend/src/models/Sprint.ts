import mongoose, {Schema, Document, Types} from 'mongoose'

export interface ISprint extends Document{
    projectId: Types.ObjectId;
    orgId: Types.ObjectId;
    name: string;
    goal?: string;
    status: 'planned' | 'active' | 'completed' | 'cancelled';
    startDate?: Date;
    endDate?: Date;
    completedAt?: Date;
    velocity: number;
    totalPoints: number;
    completedPoints: number;
    createdBy: Types.ObjectId;
}


const sprintSchema = new Schema<ISprint> (
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project reference link is required']
        },
        orgId:{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: [true, 'Organization tenant link is required']
        },
        name: {
            type: String,
            required: [true, 'Sprint name is required'],
            trim: true
        },
        goal: {
            type: String,
            maxLength: [500, 'Goal cannot exceed 500 charcters'],
            trim: true,
        },
        status: {
            type: String,
            enum: ['planned', 'active', 'completed', 'cancelled'],
            default: 'planned'
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        completedAt: {
            type: Date,
        },
        velocity: {
            type: Number,
            default: 0
        },
        totalPoints: {
            type: Number,
            default: 0
        },
        completedPoints: {
            type: Number,
            default: 0
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator reference link is required']
        }
    }, 
    {timestamps: true}
);


sprintSchema.pre('save', async function(next){
    if(this.isModified('status') && this.status === 'active'){
        const activeSprintExists = await mongoose.model('Sprint').findOne({
            projectId: this.projectId,
            status: 'active',
            _id: { $ne: this._id}
        });

        if(activeSprintExists){
            return next(new Error('Validation Error: A sprint is already active on this project. Complete it first.'))
        }
    }
    next();
});

export default mongoose.model<ISprint>('Sprint', sprintSchema);