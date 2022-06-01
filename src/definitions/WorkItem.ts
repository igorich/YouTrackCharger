export class WorkItem {
    public Project: string;
    public ID: string;
    public Description: string;
    public Title: string;
    public URL: string;
    public Priority: string; // custom
    public State: string; // custom
    public Type: string; // custom
    public Assignee: string; // custom
    public Subsystem: string;
    public FixVersions: string;
    public AffectedVersions: string;
    public FixedInBuild: string;
}
