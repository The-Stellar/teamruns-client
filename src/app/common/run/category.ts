
export class Category {
    displayName: string;
    key: CategoryOption;
    

    public static GetGategories(): Category[] {
        return [
            {
                displayName: "Custom",
                key: CategoryOption.Custom
            },
            {
                displayName: "No LTS",
                key: CategoryOption.NoLts
            },
            {
                displayName: "All Cells",
                key: CategoryOption.AllCells
            },
            {
                displayName: "100%",
                key: CategoryOption.Hundo
            },
            {
                displayName: "No FCS",
                key: CategoryOption.NoFcs
            },
            {
                displayName: "Orbless (Beta)",
                key: CategoryOption.Orbless
            },
            {
                displayName: "All Flies",
                key: CategoryOption.AllFlies
            },
            {
                displayName: "All Orbs",
                key: CategoryOption.AllOrbs
            },
        ]
    }
}

// If you change this, make sure to change it on the GOAL side as well!
export enum CategoryOption {
    Custom,
    NoLts,
    AllCells,
    Hundo,
    NoFcs,
    Orbless,
    AllFlies,
    AllOrbs
}