const mongoose = require('mongoose');
const Project = require('./models/Project');
const AuditLog = require('./models/AuditLog');

mongoose.connect('mongodb://127.0.0.1:27017/urbanhelix').then(async () => {
    const project = await Project.findById('69c0d58effe175b139707400');
    if (project) {
        const oldBudget = project.estimatedBudget;
        project.estimatedBudget += 500000;
        await project.save();
        await AuditLog.create({
            user: project.proposedBy,
            action: 'update',
            resourceType: 'project',
            resourceId: project._id,
            details: `BUDGET_CHANGE: "${project.title}" estimated budget changed from ₹${oldBudget.toLocaleString()} to ₹${project.estimatedBudget.toLocaleString()}`,
        });
        console.log('Budget updated and log created');
    } else {
        console.log('Project not found');
    }
    mongoose.disconnect();
}).catch(err => {
    console.error(err);
    mongoose.disconnect();
});
