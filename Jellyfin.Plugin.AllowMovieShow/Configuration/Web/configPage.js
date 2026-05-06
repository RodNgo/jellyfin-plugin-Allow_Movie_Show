export default function (view) {
    const AllowMovieShowConfig = {
        pluginUniqueId: '4ce5e570-aeba-4218-a0f8-741cd5701ec6',
        pageSize: 150,
        moviePageIndex: 0,
        showPageIndex: 0,
        movieTotalRecordCount: undefined,
        showTotalRecordCount: undefined,
        selectedHiddenItems: [],
        selectedToUnhideItemIds: [],
        allMovies: [],
        allShows: [],

        normalizeId: function (id) {
            if (!id) {
                return '';
            }

            return String(id).replace(/-/g, '').toLowerCase();
        },

        idsEqual: function (a, b) {
            return AllowMovieShowConfig.normalizeId(a) === AllowMovieShowConfig.normalizeId(b);
        },

        metaLibrary: function (m) {
            if (!m) {
                return '';
            }

            return m.libraryName ?? m.LibraryName ?? '';
        },

        formatMediaRowLabel: function (item) {
            const lib = item.LibraryName || '';
            return lib ? `${item.Name} — ${lib}` : item.Name;
        },

        formatHiddenRowLabel: function (item) {
            const lib = item.LibraryName || '';
            const base = `${item.Name} (${item.Type})`;
            return lib ? `${base} — ${lib}` : base;
        },

        user: {
            loadUsers: async function () {
                const users = await window.ApiClient.getUsers();
                const selectElement = document.getElementById('userToConfigure');
                selectElement.innerHTML = '';

                for (const user of users) {
                    const option = document.createElement('option');
                    option.value = user.Id;
                    option.textContent = user.Name;
                    selectElement.appendChild(option);
                }
            },
            getSelectedUserId: function () {
                return document.getElementById('userToConfigure').value;
            },
            getSelectedUserName: function () {
                const select = document.getElementById('userToConfigure');
                return select.selectedOptions[0]?.text ?? '';
            }
        },

        init: async function () {
            await this.user.loadUsers();
            await this.loadConfig();

            document.getElementById('userToConfigure').addEventListener('change', this.loadConfig);
            document.getElementById('saveButton').addEventListener('click', this.saveConfig);
            document.getElementById('applyNowButton').addEventListener('click', this.applyNow);

            document.getElementById('moviePrevPage').addEventListener('click', function () {
                AllowMovieShowConfig.goMediaPage('Movie', -1);
            });
            document.getElementById('movieNextPage').addEventListener('click', function () {
                AllowMovieShowConfig.goMediaPage('Movie', 1);
            });
            document.getElementById('showPrevPage').addEventListener('click', function () {
                AllowMovieShowConfig.goMediaPage('Series', -1);
            });
            document.getElementById('showNextPage').addEventListener('click', function () {
                AllowMovieShowConfig.goMediaPage('Series', 1);
            });
        },

        loadConfig: async function () {
            Dashboard.showLoadingMsg();
            try {
                AllowMovieShowConfig.moviePageIndex = 0;
                AllowMovieShowConfig.showPageIndex = 0;
                AllowMovieShowConfig.movieTotalRecordCount = undefined;
                AllowMovieShowConfig.showTotalRecordCount = undefined;

                const config = await ApiClient.getPluginConfiguration(AllowMovieShowConfig.pluginUniqueId);
                document.querySelector('#EnablePlugin').checked = config.EnablePlugin;
                const userConfig = config.UserRules.find(x => x.UserId === AllowMovieShowConfig.user.getSelectedUserId());
                const hiddenItemIds = userConfig?.HiddenItemIds || [];
                const hiddenItems = userConfig?.HiddenItems || [];
                if (hiddenItems.length > 0) {
                    AllowMovieShowConfig.selectedHiddenItems = hiddenItems.map(x => ({
                        Id: x.ItemId,
                        Name: x.Name || `Unknown item (${x.ItemId})`,
                        Type: x.ItemType || 'Unknown',
                        LibraryName: x.LibraryName ?? x.libraryName ?? ''
                    }));
                } else {
                    AllowMovieShowConfig.selectedHiddenItems = await AllowMovieShowConfig.resolveHiddenItems(hiddenItemIds);
                }

                await AllowMovieShowConfig.refreshUnknownHiddenNames();
                AllowMovieShowConfig.selectedToUnhideItemIds = [];
                await AllowMovieShowConfig.loadBothPages();
                AllowMovieShowConfig.renderHiddenItemsSection();
                AllowMovieShowConfig.renderAllMediaSections();
                AllowMovieShowConfig.updatePagerUi();
            } finally {
                Dashboard.hideLoadingMsg();
            }
        },

        loadBothPages: async function () {
            const movie = await AllowMovieShowConfig.loadPagedSlice('Movie', AllowMovieShowConfig.moviePageIndex);
            AllowMovieShowConfig.allMovies = movie.items;
            if (typeof movie.totalRecordCount === 'number') {
                AllowMovieShowConfig.movieTotalRecordCount = movie.totalRecordCount;
            }

            const show = await AllowMovieShowConfig.loadPagedSlice('Series', AllowMovieShowConfig.showPageIndex);
            AllowMovieShowConfig.allShows = show.items;
            if (typeof show.totalRecordCount === 'number') {
                AllowMovieShowConfig.showTotalRecordCount = show.totalRecordCount;
            }
        },

        loadPagedSlice: async function (includeItemTypes, pageIndex) {
            const userId = AllowMovieShowConfig.user.getSelectedUserId();
            const start = pageIndex * AllowMovieShowConfig.pageSize;
            const result = await ApiClient.getItems(userId, {
                Recursive: true,
                IncludeItemTypes: includeItemTypes,
                SortBy: 'SortName',
                SortOrder: 'Ascending',
                StartIndex: start,
                Limit: AllowMovieShowConfig.pageSize
            });

            const items = result?.Items || [];
            const totalRecordCount = typeof result?.TotalRecordCount === 'number' ? result.TotalRecordCount : undefined;
            const ids = items.map(i => i.Id).filter(Boolean);
            if (ids.length > 0) {
                const meta = await AllowMovieShowConfig.fetchResolveItemMetadata(ids);
                AllowMovieShowConfig.mergeLibraryIntoItems(items, meta);
            }

            return { items, totalRecordCount };
        },

        mergeLibraryIntoItems: function (items, metaList) {
            const map = new Map(
                (metaList || []).map(m => [AllowMovieShowConfig.normalizeId(m.id ?? m.Id), m])
            );
            for (const item of items) {
                const m = map.get(AllowMovieShowConfig.normalizeId(item.Id));
                const lib = AllowMovieShowConfig.metaLibrary(m);
                if (lib) {
                    item.LibraryName = lib;
                }
            }
        },

        fetchResolveItemMetadata: async function (ids) {
            if (!ids || ids.length === 0) {
                return [];
            }

            try {
                const response = await fetch('/AllowMovieShowApi/ResolveItemMetadata', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ ids: ids })
                });
                if (!response.ok) {
                    return [];
                }

                return await response.json();
            } catch (error) {
                return [];
            }
        },

        goMediaPage: async function (kind, delta) {
            const isMovie = kind === 'Movie';
            const pageKey = isMovie ? 'moviePageIndex' : 'showPageIndex';
            const totalKey = isMovie ? 'movieTotalRecordCount' : 'showTotalRecordCount';
            const assignItems = isMovie
                ? function (items) {
                    AllowMovieShowConfig.allMovies = items;
                }
                : function (items) {
                    AllowMovieShowConfig.allShows = items;
                };

            const next = AllowMovieShowConfig[pageKey] + delta;
            if (next < 0) {
                return;
            }

            Dashboard.showLoadingMsg();
            try {
                const res = await AllowMovieShowConfig.loadPagedSlice(kind, next);
                if (res.items.length === 0 && delta > 0) {
                    return;
                }

                AllowMovieShowConfig[pageKey] = next;
                assignItems(res.items);
                if (typeof res.totalRecordCount === 'number') {
                    AllowMovieShowConfig[totalKey] = res.totalRecordCount;
                }

                AllowMovieShowConfig.renderAllMediaSections();
                AllowMovieShowConfig.updatePagerUi();
            } finally {
                Dashboard.hideLoadingMsg();
            }
        },

        updatePagerUi: function () {
            const movieInfo = document.getElementById('moviePageInfo');
            const showInfo = document.getElementById('showPageInfo');
            const moviePrev = document.getElementById('moviePrevPage');
            const movieNext = document.getElementById('movieNextPage');
            const showPrev = document.getElementById('showPrevPage');
            const showNext = document.getElementById('showNextPage');

            if (movieInfo) {
                movieInfo.textContent = AllowMovieShowConfig.formatPagerLine(
                    'Movies',
                    AllowMovieShowConfig.moviePageIndex,
                    AllowMovieShowConfig.allMovies.length,
                    AllowMovieShowConfig.movieTotalRecordCount
                );
            }

            if (showInfo) {
                showInfo.textContent = AllowMovieShowConfig.formatPagerLine(
                    'Shows',
                    AllowMovieShowConfig.showPageIndex,
                    AllowMovieShowConfig.allShows.length,
                    AllowMovieShowConfig.showTotalRecordCount
                );
            }

            if (moviePrev) {
                moviePrev.disabled = AllowMovieShowConfig.moviePageIndex <= 0;
            }

            if (movieNext) {
                movieNext.disabled = !AllowMovieShowConfig.hasNextPage(
                    AllowMovieShowConfig.moviePageIndex,
                    AllowMovieShowConfig.allMovies.length,
                    AllowMovieShowConfig.movieTotalRecordCount
                );
            }

            if (showPrev) {
                showPrev.disabled = AllowMovieShowConfig.showPageIndex <= 0;
            }

            if (showNext) {
                showNext.disabled = !AllowMovieShowConfig.hasNextPage(
                    AllowMovieShowConfig.showPageIndex,
                    AllowMovieShowConfig.allShows.length,
                    AllowMovieShowConfig.showTotalRecordCount
                );
            }
        },

        formatPagerLine: function (label, pageIndex, countOnPage, totalRecordCount) {
            const ps = AllowMovieShowConfig.pageSize;
            const start = pageIndex * ps + (countOnPage > 0 ? 1 : 0);
            const end = pageIndex * ps + countOnPage;
            if (typeof totalRecordCount === 'number') {
                return `${label}: items ${start}-${end} of ${totalRecordCount} (page ${pageIndex + 1}, ${ps} per page)`;
            }

            if (countOnPage === 0) {
                return `${label}: no items on this page`;
            }

            if (countOnPage < ps) {
                return `${label}: items ${start}-${end} (last page, ${ps} per page)`;
            }

            return `${label}: items ${start}-${end} (page ${pageIndex + 1}, more available…)`;
        },

        hasNextPage: function (pageIndex, countOnPage, totalRecordCount) {
            const ps = AllowMovieShowConfig.pageSize;
            if (typeof totalRecordCount === 'number') {
                return (pageIndex + 1) * ps < totalRecordCount;
            }

            return countOnPage >= ps;
        },

        renderAllMediaSections: function () {
            AllowMovieShowConfig.renderMediaList('movieItemsContainer', AllowMovieShowConfig.allMovies);
            AllowMovieShowConfig.renderMediaList('showItemsContainer', AllowMovieShowConfig.allShows);
        },

        refreshUnknownHiddenNames: async function () {
            const stale = AllowMovieShowConfig.selectedHiddenItems.filter(
                x => !x.Name || x.Name.startsWith('Unknown item') || !x.Type || x.Type === 'Unknown' || !x.LibraryName
            );
            if (stale.length === 0) {
                return;
            }

            const resolved = await AllowMovieShowConfig.resolveHiddenItems(stale.map(x => x.Id));
            const map = new Map(resolved.map(x => [AllowMovieShowConfig.normalizeId(x.Id), x]));
            for (const item of AllowMovieShowConfig.selectedHiddenItems) {
                const r = map.get(AllowMovieShowConfig.normalizeId(item.Id));
                if (r && r.Name && !r.Name.startsWith('Unknown')) {
                    item.Name = r.Name;
                    item.Type = r.Type;
                    item.Id = r.Id;
                    const lib = AllowMovieShowConfig.metaLibrary(r);
                    if (lib) {
                        item.LibraryName = lib;
                    }
                }
            }
        },

        renderHiddenItemsSection: function () {
            const container = document.getElementById('hiddenItemsContainer');
            container.innerHTML = '';

            if (!AllowMovieShowConfig.selectedHiddenItems || AllowMovieShowConfig.selectedHiddenItems.length === 0) {
                container.innerHTML = '<div class="fieldDescription">No hidden items for this user.</div>';
                return;
            }

            for (const item of AllowMovieShowConfig.selectedHiddenItems) {
                const row = document.createElement('label');
                row.className = 'checkboxContainer';
                row.style.marginBottom = '0.4em';
                const isSelectedToUnhide = AllowMovieShowConfig.selectedToUnhideItemIds.some(
                    x => AllowMovieShowConfig.idsEqual(x, item.Id)
                );

                row.innerHTML = `
                    <input type="checkbox" is="emby-checkbox" ${isSelectedToUnhide ? 'checked' : ''} data-itemid="${item.Id}" />
                    <span>${AllowMovieShowConfig.formatHiddenRowLabel(item)}</span>
                `;

                row.querySelector('input').addEventListener('change', function (event) {
                    if (event.target.checked) {
                        if (!AllowMovieShowConfig.selectedToUnhideItemIds.some(x => AllowMovieShowConfig.idsEqual(x, item.Id))) {
                            AllowMovieShowConfig.selectedToUnhideItemIds.push(AllowMovieShowConfig.normalizeId(item.Id));
                        }
                    } else {
                        AllowMovieShowConfig.selectedToUnhideItemIds = AllowMovieShowConfig.selectedToUnhideItemIds.filter(
                            x => !AllowMovieShowConfig.idsEqual(x, item.Id)
                        );
                    }
                });

                container.appendChild(row);
            }
        },

        renderMediaList: function (containerId, items) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';

            if (!items || items.length === 0) {
                container.innerHTML = '<div class="fieldDescription">No items on this page.</div>';
                return;
            }

            for (const item of items) {
                const isSelected = AllowMovieShowConfig.selectedHiddenItems.some(x => AllowMovieShowConfig.idsEqual(x.Id, item.Id));
                const row = document.createElement('label');
                row.className = 'checkboxContainer';
                row.style.marginBottom = '0.4em';

                row.innerHTML = `
                    <input type="checkbox" is="emby-checkbox" ${isSelected ? 'checked' : ''} data-itemid="${item.Id}" />
                    <span>${AllowMovieShowConfig.formatMediaRowLabel(item)}</span>
                `;

                row.querySelector('input').addEventListener('change', function (event) {
                    if (event.target.checked) {
                        AllowMovieShowConfig.addSelectedItem(item);
                    } else {
                        AllowMovieShowConfig.removeSelectedItem(item.Id);
                    }
                });

                container.appendChild(row);
            }
        },

        addSelectedItem: function (item) {
            if (AllowMovieShowConfig.selectedHiddenItems.some(x => AllowMovieShowConfig.idsEqual(x.Id, item.Id))) {
                return;
            }

            AllowMovieShowConfig.selectedHiddenItems.push({
                Id: item.Id,
                Name: item.Name,
                Type: item.Type,
                LibraryName: item.LibraryName || ''
            });
            AllowMovieShowConfig.selectedToUnhideItemIds = AllowMovieShowConfig.selectedToUnhideItemIds.filter(
                x => !AllowMovieShowConfig.idsEqual(x, item.Id)
            );
            AllowMovieShowConfig.renderHiddenItemsSection();
            AllowMovieShowConfig.renderAllMediaSections();
        },

        removeSelectedItem: function (itemId) {
            AllowMovieShowConfig.selectedHiddenItems = AllowMovieShowConfig.selectedHiddenItems.filter(
                x => !AllowMovieShowConfig.idsEqual(x.Id, itemId)
            );
            AllowMovieShowConfig.selectedToUnhideItemIds = AllowMovieShowConfig.selectedToUnhideItemIds.filter(
                x => !AllowMovieShowConfig.idsEqual(x, itemId)
            );
            AllowMovieShowConfig.renderHiddenItemsSection();
            AllowMovieShowConfig.renderAllMediaSections();
        },

        resolveHiddenItems: async function (itemIds) {
            const normalizedIds = (itemIds || []).filter(x => !!x);
            if (normalizedIds.length === 0) {
                return [];
            }

            const url = new URL('/AllowMovieShowApi/ResolveItems', window.location.origin);
            url.searchParams.set('ids', normalizedIds.join(','));

            try {
                const response = await fetch(url.toString());
                if (!response.ok) {
                    throw new Error('Resolve items request failed');
                }

                const resolvedItems = await response.json();
                const resolvedMap = new Map(
                    (resolvedItems || []).map(x => [AllowMovieShowConfig.normalizeId(x.id ?? x.Id), x])
                );
                return normalizedIds.map(id => {
                    const resolved = resolvedMap.get(AllowMovieShowConfig.normalizeId(id));
                    if (resolved) {
                        return {
                            Id: resolved.id ?? resolved.Id,
                            Name: resolved.name ?? resolved.Name,
                            Type: resolved.type ?? resolved.Type,
                            LibraryName: AllowMovieShowConfig.metaLibrary(resolved)
                        };
                    }

                    return {
                        Id: AllowMovieShowConfig.normalizeId(id),
                        Name: `Unknown item (${id})`,
                        Type: 'Unknown',
                        LibraryName: ''
                    };
                });
            } catch (error) {
                return normalizedIds.map(id => ({
                    Id: AllowMovieShowConfig.normalizeId(id),
                    Name: `Unknown item (${id})`,
                    Type: 'Unknown',
                    LibraryName: ''
                }));
            }
        },

        saveConfig: function (e = null) {
            if (e) {
                e.preventDefault();
            }

            Dashboard.showLoadingMsg();
            ApiClient.getPluginConfiguration(AllowMovieShowConfig.pluginUniqueId).then(function (config) {
                config.EnablePlugin = document.querySelector('#EnablePlugin').checked;

                const selectedUserId = AllowMovieShowConfig.user.getSelectedUserId();
                const selectedUserName = AllowMovieShowConfig.user.getSelectedUserName();
                const userConfig = config.UserRules.find(x => x.UserId === selectedUserId);
                const hiddenItems = AllowMovieShowConfig.selectedHiddenItems
                    .filter(
                        item => !AllowMovieShowConfig.selectedToUnhideItemIds.some(u => AllowMovieShowConfig.idsEqual(u, item.Id))
                    )
                    .map(item => ({
                        ItemId: item.Id,
                        Name: item.Name,
                        ItemType: item.Type,
                        LibraryName: item.LibraryName || ''
                    }));
                const hiddenItemIds = hiddenItems
                    .map(x => x.ItemId)
                    .filter(id => !!id);

                if (userConfig) {
                    userConfig.HiddenItemIds = hiddenItemIds;
                    userConfig.HiddenItems = hiddenItems;
                } else {
                    config.UserRules.push({
                        UserId: selectedUserId,
                        UserName: selectedUserName,
                        HiddenItemIds: hiddenItemIds,
                        HiddenItems: hiddenItems
                    });
                }

                ApiClient.updatePluginConfiguration(AllowMovieShowConfig.pluginUniqueId, config)
                    .then(function (result) {
                        Dashboard.processPluginConfigurationUpdateResult(result);
                        return AllowMovieShowConfig.callApplyNow();
                    })
                    .then(function () {
                        Dashboard.alert({
                            title: 'Allow Movie Show',
                            message: 'Saved and applied immediately.'
                        });
                    })
                    .catch(function () {
                        Dashboard.alert({
                            title: 'Allow Movie Show',
                            message: 'Saved configuration, but apply-now failed. You can click Apply now button or restart Jellyfin.'
                        });
                    });
            });
        },

        applyNow: function (e = null) {
            if (e) {
                e.preventDefault();
            }

            AllowMovieShowConfig.callApplyNow()
                .then(function () {
                    Dashboard.alert({
                        title: 'Allow Movie Show',
                        message: 'Rules applied immediately without restart.'
                    });
                })
                .catch(function () {
                    Dashboard.alert({
                        title: 'Allow Movie Show',
                        message: 'Apply now failed. Please check Jellyfin logs.'
                    });
                });
        },

        callApplyNow: async function () {
            const response = await fetch('/AllowMovieShowApi/ApplyNow', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Apply now failed');
            }
        }
    };

    view.addEventListener('viewshow', async function () {
        await AllowMovieShowConfig.init();
    });
}
